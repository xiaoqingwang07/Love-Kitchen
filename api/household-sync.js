/**
 * 家庭厨房共享 API：创建 / 加入 / 拉取 / 推送
 *
 * POST body JSON:
 *   { action: 'create'|'join'|'pull'|'push', ... }
 *
 * pull/push 须携带 memberId + memberToken（401 无权限）
 */
const crypto = require('crypto')
const store = require('../lib/household/store')

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
      } catch {
        resolve({})
      }
    })
  })
}

function randomId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function randomInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

function randomMemberToken() {
  return crypto.randomBytes(24).toString('base64url')
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

function stripHouseholdSecrets(household) {
  if (!household) return household
  return {
    ...household,
    members: (household.members || []).map(({ tokenHash, ...m }) => m),
  }
}

function verifyMemberAuth(household, memberId, memberToken) {
  if (!household || !memberId || !memberToken) return false
  const member = (household.members || []).find((m) => m.id === memberId)
  if (!member?.tokenHash) return false
  return hashToken(memberToken) === member.tokenHash
}

function mergeMembers(existing, incoming) {
  const map = new Map((existing || []).map((m) => [m.id, m]))
  for (const m of incoming || []) {
    if (!m?.id) continue
    const prev = map.get(m.id)
    map.set(m.id, prev ? { ...prev, ...m, tokenHash: m.tokenHash || prev.tokenHash } : m)
  }
  return [...map.values()]
}

function memberWithToken(member) {
  const memberToken = randomMemberToken()
  return {
    memberToken,
    stored: {
      ...member,
      joinedAt: member.joinedAt || Date.now(),
      tokenHash: hashToken(memberToken),
    },
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method not allowed' })
  }

  const body = await readBody(req)
  const action = body.action

  if (!store.configured()) {
    return res.status(503).json({ ok: false, error: 'household sync not configured' })
  }

  try {
    if (action === 'create') {
      const member = body.member
      if (!member?.id || !member?.nickname) {
        return res.status(400).json({ ok: false, error: 'member required' })
      }
      const { memberToken, stored } = memberWithToken(member)
      const household = {
        householdId: randomId('hh_'),
        inviteCode: randomInviteCode(),
        members: [stored],
        pantryItems: Array.isArray(body.pantryItems) ? body.pantryItems : [],
        shoppingList: Array.isArray(body.shoppingList) ? body.shoppingList : [],
        updatedAt: Date.now(),
        updatedBy: member.nickname,
      }
      await store.saveHousehold(household)
      return res.status(200).json({ ok: true, household: stripHouseholdSecrets(household), memberToken })
    }

    if (action === 'join') {
      const code = String(body.inviteCode || '').trim().toUpperCase()
      const member = body.member
      if (!code || !member?.id) {
        return res.status(400).json({ ok: false, error: 'inviteCode and member required' })
      }
      const existing = await store.getByInviteCode(code)
      if (!existing) {
        return res.status(404).json({ ok: false, error: 'invite not found' })
      }
      const { memberToken, stored } = memberWithToken(member)
      const household = {
        ...existing,
        members: mergeMembers(existing.members, [stored]),
        updatedAt: Date.now(),
        updatedBy: member.nickname,
      }
      await store.saveHousehold(household)
      return res.status(200).json({ ok: true, household: stripHouseholdSecrets(household), memberToken })
    }

    if (action === 'pull') {
      const householdId = body.householdId
      const memberId = body.memberId
      const memberToken = body.memberToken
      if (!householdId) {
        return res.status(400).json({ ok: false, error: 'householdId required' })
      }
      const household = await store.getById(householdId)
      if (!household) {
        return res.status(404).json({ ok: false, error: 'not found' })
      }
      if (!verifyMemberAuth(household, memberId, memberToken)) {
        return res.status(401).json({ ok: false, error: 'unauthorized' })
      }
      return res.status(200).json({ ok: true, household: stripHouseholdSecrets(household) })
    }

    if (action === 'push') {
      const incoming = body.household
      const memberId = body.memberId
      const memberToken = body.memberToken
      if (!incoming?.householdId) {
        return res.status(400).json({ ok: false, error: 'household required' })
      }
      const existing = await store.getById(incoming.householdId)
      if (!existing) {
        return res.status(404).json({ ok: false, error: 'not found' })
      }
      if (!verifyMemberAuth(existing, memberId, memberToken)) {
        return res.status(401).json({ ok: false, error: 'unauthorized' })
      }
      const merged = {
        ...(existing || incoming),
        ...incoming,
        members: mergeMembers(existing?.members, incoming.members),
        shoppingList: Array.isArray(incoming.shoppingList)
          ? incoming.shoppingList
          : existing?.shoppingList || [],
        pantryItems: Array.isArray(incoming.pantryItems)
          ? incoming.pantryItems
          : existing?.pantryItems || [],
        updatedAt: Date.now(),
        updatedBy: incoming.updatedBy || existing?.updatedBy,
      }
      await store.saveHousehold(merged)
      return res.status(200).json({ ok: true, household: stripHouseholdSecrets(merged) })
    }

    return res.status(400).json({ ok: false, error: 'unknown action' })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || 'internal error' })
  }
}
