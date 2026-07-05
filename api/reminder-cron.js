/**
 * Vercel Cron：扫描所有推送计划，对「明天到期」的食材发订阅消息。
 * 建议每天跑一次（见 vercel.json 的 crons，例如每天 09:00）。
 *
 * 安全：设置 CRON_SECRET 后，Vercel Cron 会带 Authorization: Bearer <CRON_SECRET>，
 * 这里校验它，避免被公开 URL 直接触发。
 *
 * ⚠️ data 字段必须与你在公众平台申请的模板字段一一对应，下方为示例映射，
 *    请按实际模板（thing/time/date 等字段名）调整 buildTemplateData。
 */
const wx = require('../lib/reminder/wx')
const store = require('../lib/reminder/store')

const DAY = 24 * 60 * 60 * 1000

function authorized(req) {
  const secret = process.env.CRON_SECRET || ''
  if (!secret) return true // 未设置则不校验（不建议线上裸跑）
  const auth = req.headers['authorization'] || ''
  return auth === `Bearer ${secret}`
}

function fmtDate(ts) {
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** 合并同日多项临期为一则提醒 */
function buildTemplateData(items) {
  const names = items.map((i) => i.name).slice(0, 3).join('、')
  const minExpiry = Math.min(...items.map((i) => i.expiresAt))
  const expiringParam = encodeURIComponent(items.map((i) => i.name).join(','))
  return {
    data: {
      thing1: { value: names.slice(0, 20) },
      date2: { value: fmtDate(minExpiry) },
      thing3: { value: '点击查看今晚方案' },
    },
    page: `pages/result/index?from=meal&source=reminder&expiring=${expiringParam}&ingredients=${expiringParam}`,
  }
}

module.exports = async function handler(req, res) {
  if (!authorized(req)) return res.status(401).json({ ok: false, error: 'unauthorized' })
  if (!wx.wxConfigured() || !store.configured()) {
    return res.status(503).json({ ok: false, error: '服务端未配置' })
  }

  const now = Date.now()
  const windowEnd = now + 2 * DAY // 推送「未来约 1~2 天内到期」的食材

  let sent = 0
  let cleared = 0
  let users = []
  try {
    users = await store.listUsers()
  } catch {
    return res.status(500).json({ ok: false, error: 'list failed' })
  }

  for (const openid of users) {
    let schedule
    try {
      schedule = await store.getSchedule(openid)
    } catch {
      continue
    }
    if (!schedule || !Array.isArray(schedule.items)) {
      await store.removeSchedule(openid).catch(() => {})
      continue
    }

    // 合并窗口内所有临期食材为一次提醒
    const dueItems = schedule.items
      .filter((i) => i.expiresAt > now && i.expiresAt <= windowEnd)
      .sort((a, b) => a.expiresAt - b.expiresAt)

    const due = dueItems[0]

    // 全部已过期 → 计划失效，清理
    const allExpired = schedule.items.every((i) => i.expiresAt <= now)
    if (!due) {
      if (allExpired) {
        await store.removeSchedule(openid).catch(() => {})
        cleared++
      }
      continue
    }

    try {
      const tpl = buildTemplateData(dueItems.length > 0 ? dueItems : [due])
      const r = await wx.sendSubscribeMessage(
        openid,
        schedule.tmplId,
        tpl.data,
        tpl.page
      )
      if (r.ok) {
        sent++
        // 一次性订阅：发完即消耗，移除已推送的那批，避免重复打扰
        const pushedNames = new Set((dueItems.length > 0 ? dueItems : [due]).map((i) => i.name))
        const rest = schedule.items.filter((i) => !pushedNames.has(i.name))
        if (rest.length === 0) {
          await store.removeSchedule(openid).catch(() => {})
        } else {
          await store.saveSchedule(openid, { ...schedule, items: rest }).catch(() => {})
        }
      }
      // errcode 43101 = 用户未授权/已拒收：清理该用户，避免反复尝试
      else if (r.errcode === 43101) {
        await store.removeSchedule(openid).catch(() => {})
        cleared++
      }
    } catch {
      /* 单个失败不影响其余 */
    }
  }

  return res.status(200).json({ ok: true, users: users.length, sent, cleared })
}
