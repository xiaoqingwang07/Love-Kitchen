import type { PantryItem } from '../types/pantry'
import { getFreshnessStatus, getDaysLeft } from '../types/pantry'
import { slotShortLabel } from './slotLabel'

/**
 * 入库查重核心：判断「将要加入的食材」是否在冰箱里已经有了。
 * 目标——拦住"不知道放哪/不知道还有"导致的重复购买。
 *
 * 设计原则：宁可漏判，不要误伤。
 *  - 只有「完全相等 / 一方完整包含另一方（≥2字）/ 同义词同组」才算重复；
 *  - 不做单字 substring（避免 牛奶↔酸奶、鸡蛋↔鸭蛋 这类误判）。
 */

/** 入库时常见的修饰词/包装词，归一化时剥掉，避免"进口香蕉"≠"香蕉" */
const MODIFIERS = [
  '新鲜', '进口', '有机', '土', '老', '现杀', '现切', '冷鲜', '速冻', '冷冻', '冰鲜',
  '精品', '特级', '一级', '散装', '盒装', '袋装', '瓶装', '罐装', '牌', '装',
]

/** 同义词组：组内任意两名视为同一食材 */
const SYNONYM_GROUPS: string[][] = [
  ['西红柿', '番茄', '圣女果', '小番茄'],
  ['青椒', '甜椒', '彩椒', '柿子椒', '灯笼椒'],
  ['土豆', '马铃薯', '洋芋'],
  ['牛奶', '纯牛奶', '鲜奶', '全脂奶', '脱脂奶'],
  ['香菜', '芫荽'],
  ['包菜', '卷心菜', '圆白菜', '甘蓝', '莲花白'],
  ['红薯', '地瓜', '番薯', '甘薯'],
  ['西葫芦', '角瓜'],
  ['鸡胸肉', '鸡脯肉', '鸡胸'],
  ['大蒜', '蒜头', '蒜瓣'],
  ['生姜', '姜', '老姜', '嫩姜'],
  ['粉丝', '粉条', '红薯粉'],
  ['吐司', '土司', '切片面包'],
]

/** 归一化：去空格/标点、转小写、剥离修饰词与尾部数量 */
export function normalizeName(raw: string): string {
  let s = (raw || '').trim().toLowerCase()
  // 去掉常见标点和空白
  s = s.replace(/[\s·、，,。.\-_/（）()【】\[\]]/g, '')
  // 剥掉尾部数量描述，如 "牛奶1l" "排骨500g" "番茄3个"
  s = s.replace(/[\d.]+\s*(g|kg|克|千克|斤|两|公斤|ml|l|毫升|升|个|只|盒|包|袋|把|根|条|颗|瓶|罐|片|块|份|适量)$/u, '')
  // 剥掉修饰词
  for (const m of MODIFIERS) {
    if (s.length > m.length) s = s.split(m).join('')
  }
  return s
}

function sameSynonymGroup(a: string, b: string): boolean {
  for (const g of SYNONYM_GROUPS) {
    const ia = g.some((w) => a.includes(w) || w.includes(a))
    const ib = g.some((w) => b.includes(w) || w.includes(b))
    if (ia && ib) return true
  }
  return false
}

/** 两个名字是否指向"同一种食材" */
export function isSameFood(nameA: string, nameB: string): boolean {
  const a = normalizeName(nameA)
  const b = normalizeName(nameB)
  if (!a || !b) return false
  if (a === b) return true
  // 完整包含，且较短的那个至少 2 字（避免单字误伤）
  const shorter = a.length <= b.length ? a : b
  const longer = a.length <= b.length ? b : a
  if (shorter.length >= 2 && longer.includes(shorter)) return true
  return sameSynonymGroup(a, b)
}

/** 在现有库存里找出与 name 重复的全部条目（可能多条：上次买的还没吃完） */
export function findDuplicates(name: string, items: PantryItem[]): PantryItem[] {
  return items.filter((i) => isSameFood(i.name, name))
}

/** 距今放了几天 */
export function daysSinceAdded(item: PantryItem): number {
  return Math.max(0, Math.floor((Date.now() - item.addedAt) / (24 * 60 * 60 * 1000)))
}

/** 单条重复项的人话描述："冷藏·第2层 · 放了3天 · 还剩2天" */
export function describeExisting(item: PantryItem): string {
  const where = slotShortLabel(item.side, item.slotIndex)
  const aged = daysSinceAdded(item)
  const agedText = aged <= 0 ? '今天刚放' : `放了${aged}天`
  const status = getFreshnessStatus(item)
  let freshText: string
  if (status === 'expired') freshText = '已过期'
  else {
    const left = getDaysLeft(item)
    freshText = left <= 0 ? '今天到期' : left === 1 ? '明天到期' : `还剩${left}天`
  }
  return `${where} · ${agedText} · ${freshText}`
}

/** 生成弹窗用整段提示文案，含"先吃旧的"引导 */
export function buildDuplicateWarning(name: string, dups: PantryItem[]): string {
  const lines = dups.map((d) => `· ${d.name}（${d.amount}）：${describeExisting(d)}`)
  const hasOld = dups.some((d) => getFreshnessStatus(d) !== 'fresh')
  const tail = hasOld
    ? '\n\n其中有临期/过期的，建议先吃旧的，别再囤了。'
    : '\n\n确定还要再加一份吗？'
  return `冰箱里已经有「${name}」了：\n${lines.join('\n')}${tail}`
}
