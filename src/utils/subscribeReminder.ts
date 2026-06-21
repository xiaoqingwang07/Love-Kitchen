/**
 * 临期召回：微信「一次性订阅消息」客户端流程。
 *
 * 召回闭环（两段式）：
 *   1) 客户端在用户点击里调 requestSubscribeMessage 拿到一次授权（每次授权 = 服务端可推 1 条）；
 *   2) 客户端用 wx.login 的 code + 临期食材清单 POST 给服务端登记，
 *      服务端换 openid 并按到期日定时调 subscribeMessage.send 推送。
 *
 * 构建变量（config/index.js 注入，均可留空，留空则功能优雅降级）：
 *   TARO_APP_EXPIRY_TMPL_ID    —— 公众平台申请的订阅消息模板 id
 *   TARO_APP_REMINDER_API_URL  —— 服务端登记接口（如 https://xxx.vercel.app/api/reminder-register）
 */
import Taro from '@tarojs/taro'
import { STORAGE_KEYS } from '../store/storageKeys'
import type { PantryItem } from '../types/pantry'

const DAY = 24 * 60 * 60 * 1000
/** 登记到期窗口：未来 3 天内到期的食材纳入推送计划 */
const REGISTER_WINDOW_DAYS = 3
/** 登记节流：同一天最多向服务端登记一次 */
const REGISTER_THROTTLE_MS = 12 * 60 * 60 * 1000

export interface ReminderState {
  /** 用户是否开启了临期提醒 */
  optedIn: boolean
  /** 剩余可推送次数（每次授权 +1，估算值，真实余额以服务端为准） */
  consentCount: number
  /** 上次成功登记服务端的时间戳 */
  lastRegisterAt: number
}

const DEFAULT_STATE: ReminderState = {
  optedIn: false,
  consentCount: 0,
  lastRegisterAt: 0,
}

function templateId(): string {
  return typeof TARO_APP_EXPIRY_TMPL_ID === 'string' ? TARO_APP_EXPIRY_TMPL_ID.trim() : ''
}

function registerApiUrl(): string {
  return typeof TARO_APP_REMINDER_API_URL === 'string' ? TARO_APP_REMINDER_API_URL.trim() : ''
}

/** 模板已配置才可用（未配置时 UI 应提示"未配置"而非报错） */
export function reminderConfigured(): boolean {
  return templateId().length > 0
}

export function getReminderState(): ReminderState {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEYS.expiryReminder)
    if (raw && typeof raw === 'object') {
      return { ...DEFAULT_STATE, ...(raw as Partial<ReminderState>) }
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_STATE }
}

function saveReminderState(patch: Partial<ReminderState>): ReminderState {
  const next = { ...getReminderState(), ...patch }
  try {
    Taro.setStorageSync(STORAGE_KEYS.expiryReminder, next)
  } catch {
    /* ignore */
  }
  return next
}

export type ConsentResult = 'accepted' | 'rejected' | 'banned' | 'unconfigured' | 'error'

/**
 * 请求一次订阅授权。**必须在用户点击事件中调用**（微信限制）。
 * 成功返回 'accepted' 并累加可推送次数。
 */
export async function requestExpiryReminderConsent(): Promise<ConsentResult> {
  const tmplId = templateId()
  if (!tmplId) return 'unconfigured'

  try {
    const res = (await Taro.requestSubscribeMessage({ tmplIds: [tmplId] })) as unknown as Record<
      string,
      string
    >
    const status = res?.[tmplId]
    if (status === 'accept') {
      const state = getReminderState()
      saveReminderState({ optedIn: true, consentCount: state.consentCount + 1 })
      return 'accepted'
    }
    if (status === 'ban') return 'banned'
    return 'rejected'
  } catch {
    return 'error'
  }
}

/** 用户主动关闭提醒（不撤销已授权次数，仅停止后续登记） */
export function disableExpiryReminder(): void {
  saveReminderState({ optedIn: false })
}

function soonestExpiringPayload(items: PantryItem[]): { name: string; expiresAt: number }[] {
  const now = Date.now()
  const limit = now + REGISTER_WINDOW_DAYS * DAY
  return items
    .filter((i) => i.expiresAt > now && i.expiresAt <= limit)
    .sort((a, b) => a.expiresAt - b.expiresAt)
    .slice(0, 10)
    .map((i) => ({ name: i.name, expiresAt: i.expiresAt }))
}

/**
 * 把临期食材登记到服务端，由服务端在到期前推送。
 * 仅在已开启、配置了登记接口、且过了节流窗口时发起；任何失败都静默不影响主流程。
 */
export async function syncExpiryReminders(
  items: PantryItem[],
  opts: { force?: boolean } = {}
): Promise<boolean> {
  const state = getReminderState()
  const url = registerApiUrl()
  const tmplId = templateId()
  if (!state.optedIn || !url || !tmplId) return false
  if (!opts.force && Date.now() - state.lastRegisterAt < REGISTER_THROTTLE_MS) return false

  const payloadItems = soonestExpiringPayload(items)
  if (payloadItems.length === 0) return false

  try {
    const { code } = await Taro.login()
    if (!code) return false
    const res = await Taro.request({
      url,
      method: 'POST',
      timeout: 15000,
      header: { 'content-type': 'application/json' },
      data: { code, tmplId, items: payloadItems },
    })
    if (res.statusCode >= 200 && res.statusCode < 300) {
      saveReminderState({ lastRegisterAt: Date.now() })
      return true
    }
    return false
  } catch {
    return false
  }
}
