/**
 * 家庭厨房共享数据（Upstash Redis REST，与 reminder store 同配置）
 */
const URL = process.env.UPSTASH_REDIS_REST_URL || ''
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || ''

function configured() {
  return URL.length > 0 && TOKEN.length > 0
}

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

const dataKey = (id) => `hh:data:${id}`
const codeKey = (code) => `hh:code:${String(code).toUpperCase()}`

module.exports = {
  configured,

  async saveHousehold(household) {
    if (!configured()) return false
    const payload = JSON.stringify(household)
    await cmd(['SET', dataKey(household.householdId), payload])
    await cmd(['SET', codeKey(household.inviteCode), household.householdId])
    return true
  },

  async getById(householdId) {
    const raw = await cmd(['GET', dataKey(householdId)])
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },

  async getByInviteCode(code) {
    const id = await cmd(['GET', codeKey(String(code).trim().toUpperCase())])
    if (!id) return null
    return this.getById(id)
  },
}
