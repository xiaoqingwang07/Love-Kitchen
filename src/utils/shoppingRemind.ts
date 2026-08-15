import Taro from '@tarojs/taro'
import { STORAGE_KEYS } from '../store/storageKeys'

const DAY_MS = 24 * 60 * 60 * 1000

export function todayYmd(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseYmd(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) return null
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 10, 0, 0, 0)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export function formatRemindLabel(ymd: string): string {
  const date = parseYmd(ymd)
  if (!date) return ymd
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`
}

export function buildShoppingIcs(ymd: string, itemNames: string[]): string {
  const compact = ymd.replace(/-/g, '')
  const title = itemNames.length > 0 ? `超市采购 · ${itemNames.length} 样` : '超市采购'
  const desc = itemNames.length > 0 ? `待买：${itemNames.join('、')}。买完到爱心厨房冰箱入库。` : '打开爱心厨房冰箱页，按清单采购后入库。'
  const stamp = `${compact}T010000Z`
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Love Kitchen//Shopping Reminder//CN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:lk-shop-${compact}@love-kitchen`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc.replace(/\r?\n/g, ' ')}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:-PT2H',
    'DESCRIPTION:记得买菜，买完放入冰箱',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function loadShoppingRemindDate(): string {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEYS.shoppingBuyRemindAt)
    return typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : ''
  } catch {
    return ''
  }
}

export function saveShoppingRemindDate(ymd: string): void {
  try {
    Taro.setStorageSync(STORAGE_KEYS.shoppingBuyRemindAt, ymd)
  } catch {
    /* ignore */
  }
}

export type ShoppingRemindResult = 'calendar' | 'ics' | 'copied' | 'failed'

function tryDownloadIcs(ics: string): boolean {
  if (typeof document === 'undefined') return false
  try {
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'love-kitchen-shopping.ics'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return true
  } catch {
    return false
  }
}

/**
 * 把采购日写进手机日历（带闹钟）。微信没有系统待办/闹钟 API，
 * 日历事件是小程序能写入系统提醒的官方能力；H5 失败时下载 .ics 或复制文案。
 */
export async function scheduleShoppingReminder(opts: {
  ymd: string
  itemNames: string[]
}): Promise<ShoppingRemindResult> {
  const date = parseYmd(opts.ymd)
  if (!date) return 'failed'
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  if (date.getTime() + 14 * 60 * 60 * 1000 < todayStart.getTime()) return 'failed'

  saveShoppingRemindDate(opts.ymd)
  const title = opts.itemNames.length > 0 ? `超市采购 · ${opts.itemNames.length} 样` : '超市采购'
  const description =
    opts.itemNames.length > 0
      ? `待买：${opts.itemNames.slice(0, 12).join('、')}${opts.itemNames.length > 12 ? ' 等' : ''}。买完到爱心厨房冰箱入库。`
      : '打开爱心厨房冰箱页，按清单采购后入库。'

  try {
    if (typeof Taro.addPhoneCalendar === 'function') {
      await Taro.addPhoneCalendar({
        title,
        startTime: Math.floor(date.getTime() / 1000),
        allDay: false,
        alarm: true,
        alarmOffset: 0,
        description,
      })
      return 'calendar'
    }
  } catch {
    /* 用户拒绝或运行时不支持，走 ICS / 复制 */
  }

  const ics = buildShoppingIcs(opts.ymd, opts.itemNames)
  if (tryDownloadIcs(ics)) return 'ics'

  try {
    await Taro.setClipboardData({ data: `${title}\n${opts.ymd} 10:00\n${description}` })
    return 'copied'
  } catch {
    return 'failed'
  }
}

export function remindDateStillValid(ymd: string, now = Date.now()): boolean {
  const date = parseYmd(ymd)
  if (!date) return false
  return date.getTime() + DAY_MS > now
}
