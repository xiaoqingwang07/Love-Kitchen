import type { FridgeSide } from './fridge'

export type FoodCategory =
  | 'vegetable'
  | 'meat'
  | 'seafood'
  | 'fruit'
  | 'dairy'
  | 'egg'
  | 'grain'
  | 'seasoning'
  | 'other'

export interface PantryItem {
  id: string
  name: string
  category: FoodCategory
  amount: string
  addedAt: number
  expiresAt: number
  defaultShelfLife: number
  /** 冷冻 | 冷藏；与冰箱 UI 格位对应 */
  side: FridgeSide
  /** 0–4 抽拉层（自上而下），5–6 抽屉 */
  slotIndex: number
}

export type FreshnessStatus = 'fresh' | 'expiring' | 'expired'

/**
 * 分类阈值（天数）：当剩余天数低于此值时视为「临期」。
 * 同时结合保质期比例：剩余时间 < 保质期的 20% 时，也视为临期。
 * 两者满足其一即为临期，取较宽松的那个。
 */
const EXPIRING_THRESHOLD_DAYS: Record<FoodCategory, number> = {
  vegetable: 1,   // 蔬菜最多存 3~7 天，1 天内视为临期
  fruit:     1,   // 水果同蔬菜
  meat:      1,   // 鲜肉极易变质
  seafood:   1,   // 海鲜最敏感
  dairy:     2,   // 牛奶/酸奶给 2 天缓冲
  egg:       3,   // 鸡蛋保质期长，3 天提醒
  grain:     7,   // 米面类保质期长
  seasoning: 14,  // 调料保质期很长
  other:     3,   // 其他默认 3 天
}

/** 保质期剩余比例低于 20% 时，也视为临期（兜底策略） */
const EXPIRING_RATIO_THRESHOLD = 0.20

export function getFreshnessStatus(item: PantryItem): FreshnessStatus {
  const now = Date.now()
  if (now >= item.expiresAt) return 'expired'

  const msLeft = item.expiresAt - now
  const daysLeft = msLeft / (1000 * 60 * 60 * 24)

  // 按分类阈值判断
  const thresholdDays = EXPIRING_THRESHOLD_DAYS[item.category] ?? 3
  if (daysLeft <= thresholdDays) return 'expiring'

  // 按保质期比例判断（兜底）
  const totalMs = item.defaultShelfLife * 24 * 60 * 60 * 1000
  if (totalMs > 0 && msLeft / totalMs <= EXPIRING_RATIO_THRESHOLD) return 'expiring'

  return 'fresh'
}

export function getDaysLeft(item: PantryItem): number {
  const ms = item.expiresAt - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

/** 返回人可读的临期提示文案 */
export function getExpiryLabel(item: PantryItem): string {
  const status = getFreshnessStatus(item)
  if (status === 'expired') return '已过期'
  const days = getDaysLeft(item)
  if (status === 'expiring') {
    if (days <= 0) return '今天到期'
    if (days === 1) return '明天到期'
    return `还剩 ${days} 天`
  }
  return `还剩 ${days} 天`
}
