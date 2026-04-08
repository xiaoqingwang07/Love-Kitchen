/**
 * Vercel Serverless：把 OpenAI 兼容的 chat/completions 请求转发到 MiniMax。
 * 环境变量（仅服务端）：
 *   MINIMAX_API_KEY — 必填
 *   LLM_PROXY_SHARED_SECRET — 可选；若设置则要求请求头 X-LLM-Proxy-Secret 一致
 *   LLM_PROXY_CORS_ORIGINS — 可选；逗号分隔的允许 Origin 列表（如 "https://a.com,https://b.com"）
 *                               未设置时采用保守默认列表
 *
 * 部署后将完整 URL 写入客户端构建变量 TARO_APP_LLM_PROXY_URL（如 https://xxx.vercel.app/api/llm-proxy）
 */

/* ───────── 常量 ───────── */

/** 允许转发到上游的请求体字段（白名单） */
const ALLOWED_FIELDS = ['model', 'messages', 'temperature', 'max_tokens']

/** 每 IP 每分钟最大请求数 */
const RATE_LIMIT_MAX = 20

/** 限流窗口（ms） */
const RATE_WINDOW_MS = 60_000

/* ───────── 内存限流器 ───────── */

// ip -> number[]（每次请求的时间戳）
const rateMap = /** @type {Map<string, number[]>} */ (new Map())

/**
 * 判断指定 IP 是否超出速率限制，同时记录本次请求。
 * 在 serverless 环境中，同一实例会复用内存，因此有效；
 * 跨实例时每个实例各自计数，限制更宽松而非更严格，安全性可接受。
 * @param {string} ip
 * @returns {boolean} true = 被限流（应拒绝）
 */
function isRateLimited(ip) {
  const now = Date.now()
  const windowStart = now - RATE_WINDOW_MS
  let timestamps = rateMap.get(ip)
  if (!timestamps) {
    timestamps = []
    rateMap.set(ip, timestamps)
  }
  // 清理窗口外的旧记录
  while (timestamps.length > 0 && timestamps[0] < windowStart) {
    timestamps.shift()
  }
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return true
  }
  timestamps.push(now)
  return false
}

/* ───────── CORS ───────── */

/**
 * 读取允许的 Origin 列表。
 * 优先级：环境变量 > 保守默认值。
 * @returns {string[]}
 */
function getAllowedOrigins() {
  const env = process.env.LLM_PROXY_CORS_ORIGINS
  if (env) {
    return env.split(',').map((s) => s.trim()).filter(Boolean)
  }
  // 保守默认：仅允许 localhost 与 127.0.0.1（开发环境）
  return ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000', 'http://127.0.0.1:3000']
}

/**
 * 检查请求 Origin 是否在允许列表中。
 * @param {string|undefined} origin
 * @returns {{ allowed: boolean, origin: string }}
 */
function checkOrigin(origin) {
  if (!origin) return { allowed: false, origin: '' }
  const list = getAllowedOrigins()
  if (list.includes(origin)) return { allowed: true, origin }
  return { allowed: false, origin }
}

/* ───────── 请求体净化 ───────── */

/**
 * 从原始请求体中提取白名单字段，忽略其余字段。
 * @param {Record<string, unknown>} body
 * @returns {Record<string, unknown>}
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return {}
  /** @type {Record<string, unknown>} */ const clean = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) {
      clean[key] = body[key]
    }
  }
  return clean
}

/* ───────── 主处理函数 ───────── */

module.exports = async function llmProxy(req, res) {
  /* ---- 1. CORS 预检 ---- */
  const originInfo = checkOrigin(req.headers['origin'])

  if (req.method === 'OPTIONS') {
    if (!originInfo.allowed) {
      return res.status(403).json({ error: 'Origin not allowed' })
    }
    res.setHeader('Access-Control-Allow-Origin', originInfo.origin)
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-LLM-Proxy-Secret')
    return res.status(204).end()
  }

  /* ---- 2. 方法限制 ---- */
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  /* ---- 3. CORS 校验（非预检 POST） ---- */
  if (!originInfo.allowed) {
    return res.status(403).json({ error: 'Origin not allowed' })
  }
  res.setHeader('Access-Control-Allow-Origin', originInfo.origin)

  /* ---- 4. 共享密钥验证 ---- */
  const shared = process.env.LLM_PROXY_SHARED_SECRET
  if (shared) {
    const h = req.headers['x-llm-proxy-secret']
    if (h !== shared) return res.status(403).json({ error: 'Forbidden' })
  }

  /* ---- 5. IP 限流 ---- */
  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'

  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Too Many Requests' })
  }

  /* ---- 6. API Key 检查 ---- */
  const key = process.env.MINIMAX_API_KEY
  if (!key) {
    return res.status(500).json({ error: 'Service misconfigured' })
  }

  /* ---- 7. 请求体净化 + 转发 ---- */
  const sanitized = sanitizeBody(req.body)

  try {
    const r = await fetch('https://api.minimaxi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(sanitized),
    })
    if (!r.ok) {
      return res.status(r.status).json({ error: 'Upstream request failed' })
    }

    const text = await r.text()
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.status(r.status).send(text)
  } catch (_e) {
    // 隐藏上游错误详情，返回通用错误消息
    res.status(502).json({ error: 'Upstream service unavailable' })
  }
}
