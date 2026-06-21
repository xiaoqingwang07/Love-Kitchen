/**
 * Vercel Serverless：登记某用户的临期推送计划。
 * 客户端 POST { code, tmplId, items:[{name, expiresAt}] }
 *   - code: wx.login 获取，用于换 openid
 *   - tmplId: 订阅消息模板 id
 *   - items: 未来数日内将到期的食材（客户端已筛选）
 *
 * 环境变量见 lib/reminder/wx.js 与 lib/reminder/store.js。
 */
const wx = require('../lib/reminder/wx')
const store = require('../lib/reminder/store')

const MAX_ITEMS = 10
const MAX_NAME_LEN = 40

function bad(res, code, msg) {
  res.status(code).json({ ok: false, error: msg })
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'content-type')
    return res.status(204).end()
  }
  if (req.method !== 'POST') return bad(res, 405, 'method not allowed')

  if (!wx.wxConfigured() || !store.configured()) {
    return bad(res, 503, '服务端未配置（WX_APPID/WX_SECRET/UPSTASH_*）')
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return bad(res, 400, 'invalid json')
    }
  }
  const { code, tmplId, items } = body || {}
  if (typeof code !== 'string' || !code) return bad(res, 400, 'missing code')
  if (typeof tmplId !== 'string' || !tmplId) return bad(res, 400, 'missing tmplId')
  if (!Array.isArray(items) || items.length === 0) return bad(res, 400, 'missing items')

  // 清洗 items
  const clean = items
    .filter(
      (i) =>
        i &&
        typeof i.name === 'string' &&
        i.name.length > 0 &&
        typeof i.expiresAt === 'number' &&
        Number.isFinite(i.expiresAt)
    )
    .slice(0, MAX_ITEMS)
    .map((i) => ({ name: i.name.slice(0, MAX_NAME_LEN), expiresAt: i.expiresAt }))
  if (clean.length === 0) return bad(res, 400, 'no valid items')

  try {
    const openid = await wx.code2openid(code)
    if (!openid) return bad(res, 401, 'login failed')
    await store.saveSchedule(openid, {
      tmplId,
      items: clean,
      updatedAt: Date.now(),
    })
    return res.status(200).json({ ok: true, count: clean.length })
  } catch (e) {
    return bad(res, 500, 'register failed')
  }
}
