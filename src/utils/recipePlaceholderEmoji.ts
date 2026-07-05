/** 封面图加载失败时的占位 emoji（与菜名相关，避免统一显示 🥟 造成误解） */
export function recipePlaceholderEmoji(title: string, tags?: string[]): string {
  const t = (title || '').trim()
  const tagStr = (tags || []).join(' ')
  const hay = `${t} ${tagStr}`

  if (/饺|包子|馄饨|锅贴|烧卖|云吞/.test(hay)) return '🥟'
  if (/面|粉|米线|拉面|意面/.test(hay)) return '🍜'
  if (/饭|炒饭|盖浇|焖饭|寿司/.test(hay)) return '🍚'
  if (/汤|羹|粥/.test(hay)) return '🍲'
  if (/沙拉|凉拌|凉菜|轻食/.test(hay)) return '🥗'
  if (/虾|蟹|鱼|贝|海鲜|鲈|带鱼/.test(hay)) return '🐟'
  if (/鸡|翅|鸭|鹅/.test(hay)) return '🍗'
  if (/牛|羊|猪|肉|排骨|里脊/.test(hay)) return '🥩'
  if (/蛋|炒蛋|蒸蛋/.test(hay)) return '🍳'
  if (/豆腐|豆皮/.test(hay)) return '🧈'
  if (/蛋糕|甜品|布丁|奶茶/.test(hay)) return '🍰'

  return '🥘'
}
