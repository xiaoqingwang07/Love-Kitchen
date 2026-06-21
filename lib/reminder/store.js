/**
 * 极简 Upstash Redis (REST) 客户端，用于存储临期推送计划。
 * 环境变量：UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 *
 * 未配置时所有方法降级为 no-op / 空结果（本地可跑通流程，但不会真正持久化）。
 * 也可换成 Vercel KV / 任意 Redis：只需保持下列方法签名。
 */

const URL = process.env.UPSTASH_REDIS_REST_URL || ''
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || ''

function configured() {
  return URL.length > 0 && TOKEN.length > 0
}

/**
 * 执行单条 Redis 命令（Upstash REST：POST 一个 JSON 数组）。
 * @param {(string|number)[]} args
 * @returns {Promise<any>}
 */
async function cmd(args) {
  if (!configured()) return null
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(args),
  })
  if (!res.ok) throw new Error(`upstash ${res.status}`)
  const data = await res.json()
  return data.result
}

const USERS_SET = 'rmd:users'
const userKey = (openid) => `rmd:user:${openid}`

module.exports = {
  configured,

  /** 写入/更新某用户的推送计划，并登记到用户集合 */
  async saveSchedule(openid, schedule) {
    if (!configured()) return
    await cmd(['SET', userKey(openid), JSON.stringify(schedule)])
    await cmd(['SADD', USERS_SET, openid])
  },

  /** 读取某用户的推送计划 */
  async getSchedule(openid) {
    const raw = await cmd(['GET', userKey(openid)])
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },

  /** 删除某用户的推送计划 */
  async removeSchedule(openid) {
    if (!configured()) return
    await cmd(['DEL', userKey(openid)])
    await cmd(['SREM', USERS_SET, openid])
  },

  /** 列出所有有计划的 openid */
  async listUsers() {
    const ids = await cmd(['SMEMBERS', USERS_SET])
    return Array.isArray(ids) ? ids : []
  },

  /** 通用 get/set，供 access_token 缓存复用 */
  async get(key) {
    return cmd(['GET', key])
  },
  async setEx(key, value, ttlSec) {
    if (!configured()) return
    await cmd(['SET', key, value, 'EX', ttlSec])
  },
}
