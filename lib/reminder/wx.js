/**
 * 微信服务端 API 封装：换 openid、取 access_token（带缓存）、发订阅消息。
 * 环境变量：WX_APPID / WX_SECRET（小程序后台获取，仅服务端持有）
 */
const store = require('./store')

const APPID = process.env.WX_APPID || ''
const SECRET = process.env.WX_SECRET || ''
const TOKEN_CACHE_KEY = 'rmd:wx:access_token'

function wxConfigured() {
  return APPID.length > 0 && SECRET.length > 0
}

/** code -> openid（一次性 code，登录态校验） */
async function code2openid(code) {
  if (!wxConfigured()) throw new Error('WX_APPID/WX_SECRET 未配置')
  const url =
    `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}` +
    `&secret=${SECRET}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`
  const res = await fetch(url)
  const data = await res.json()
  if (data.errcode) throw new Error(`jscode2session ${data.errcode}: ${data.errmsg}`)
  return data.openid
}

// 实例内存缓存，跨实例时回落到 KV
let memToken = { value: '', expiresAt: 0 }

async function getAccessToken() {
  if (!wxConfigured()) throw new Error('WX_APPID/WX_SECRET 未配置')
  const now = Date.now()
  if (memToken.value && memToken.expiresAt > now + 60_000) return memToken.value

  // 先看 KV 缓存
  try {
    const cached = await store.get(TOKEN_CACHE_KEY)
    if (cached) {
      memToken = { value: cached, expiresAt: now + 60 * 60 * 1000 }
      return cached
    }
  } catch {
    /* KV 不可用则直接拉新 */
  }

  const url =
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential` +
    `&appid=${APPID}&secret=${SECRET}`
  const res = await fetch(url)
  const data = await res.json()
  if (!data.access_token) throw new Error(`token ${data.errcode}: ${data.errmsg}`)
  const ttl = Math.max(600, (data.expires_in || 7200) - 300)
  memToken = { value: data.access_token, expiresAt: now + ttl * 1000 }
  try {
    await store.setEx(TOKEN_CACHE_KEY, data.access_token, ttl)
  } catch {
    /* 忽略缓存写失败 */
  }
  return data.access_token
}

/**
 * 发送一次性订阅消息。
 * @param {string} openid
 * @param {string} templateId
 * @param {Record<string, {value: string}>} data  字段需与模板一致
 * @returns {Promise<{ok: boolean, errcode: number, errmsg: string}>}
 */
async function sendSubscribeMessage(openid, templateId, data, page) {
  const token = await getAccessToken()
  const res = await fetch(
    `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${token}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        touser: openid,
        template_id: templateId,
        page: page || 'pages/pantry/index',
        data,
        miniprogram_state: 'formal',
        lang: 'zh_CN',
      }),
    }
  )
  const out = await res.json()
  return { ok: out.errcode === 0, errcode: out.errcode, errmsg: out.errmsg }
}

module.exports = { wxConfigured, code2openid, getAccessToken, sendSubscribeMessage }
