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

export function isWebRuntime(): boolean {
  try {
    return Taro.getEnv() === Taro.ENV_TYPE.WEB
  } catch {
    return typeof document !== 'undefined'
  }
}

/**
 * H5 用系统日期控件。Taro Picker 在网页里点选容易被父级 onClick 吞掉，
 * 系统 `<input type="date">` 才能真正弹出日历。
 */
export function openWebDatePicker(opts: {
  value: string
  min?: string
  onPick: (ymd: string) => void
}): boolean {
  if (typeof document === 'undefined') return false
  const existing = document.getElementById('lk-shop-date-picker')
  existing?.remove()
  const input = document.createElement('input')
  input.id = 'lk-shop-date-picker'
  input.type = 'date'
  input.min = opts.min || todayYmd()
  input.value = opts.value && /^\d{4}-\d{2}-\d{2}$/.test(opts.value) ? opts.value : todayYmd()
  input.setAttribute('aria-label', '购买日')
  Object.assign(input.style, {
    position: 'fixed',
    right: '16px',
    top: '96px',
    zIndex: '2147483647',
    fontSize: '16px',
    padding: '6px 8px',
    borderRadius: '8px',
    border: '1px solid #e8c4b0',
    background: '#fff',
    color: '#5c3a2e',
  })
  let done = false
  const finish = (ymd?: string) => {
    if (done) return
    done = true
    input.remove()
    if (ymd && /^\d{4}-\d{2}-\d{2}$/.test(ymd)) opts.onPick(ymd)
  }
  input.addEventListener('change', () => finish(input.value))
  input.addEventListener('cancel', () => finish())
  document.body.appendChild(input)
  try {
    const picker = input as HTMLInputElement & { showPicker?: () => void }
    if (typeof picker.showPicker === 'function') picker.showPicker()
    else input.focus()
  } catch {
    input.focus()
  }
  return true
}

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
    if (!isWebRuntime() && typeof Taro.addPhoneCalendar === 'function') {
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
