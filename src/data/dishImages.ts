/**
 * 菜谱配图智能匹配库
 *
 * 本地菜谱库（200→2000 道）：**仅**使用下厨房 CDN 真实照片（`i2.chuimg.com`），
 * 见 `pickRealDishImage` + `exactDishImages.ts` / `stepImages.ts`。
 * 禁止 SVG、Unsplash 随机图、AI 生成图充当本地菜谱封面/步骤图。
 *
 * 下方 Unsplash 池仅供历史兼容；`enrichRecipeMedia` 已不再对本地菜调用 `pickDishImage`。
 */

import { EXACT_DISH_IMAGE_OVERRIDES } from './exactDishImages'

/** 是否为下厨房等真实菜品 CDN 图（非 SVG / Unsplash / 损坏 URL） */
export function isRealDishPhotoUrl(url: string): boolean {
  const u = String(url || '')
  if (!/i\d+\.chuimg\.com/i.test(u)) return false
  // srcset 解析失败产生的畸形 resize 参数
  if (/\/w\/\d+\/h\/(?:\/|$|\?)/i.test(u)) return false
  if (/\.(?:jpe?g|png|webp)\/interlace/i.test(u)) return false
  return true
}

/**
 * 本地菜谱封面：只返回下厨房真实图，无映射时不造假图。
 * 优先精确封面表，其次该菜第一张步骤过程图。
 */
export function pickRealDishImage(title: string, stepImages: string[] = []): string {
  const t = (title || '').trim()
  if (!t) return ''

  const exact = EXACT_DISH_IMAGE_OVERRIDES[t]
  if (exact && isRealDishPhotoUrl(exact)) return exact

  for (const u of stepImages) {
    if (isRealDishPhotoUrl(u)) return u
  }
  return ''
}

const U = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`

// ========== 1. 按"做法 / 主食材"分类的图池 ==========
// 每池都是按搜索关键词反查后人工筛选过的，确保大体相符

/** 红烧 / 炖煮 / 卤味（红润、汤汁浓郁） */
const BRAISED_POOL = [
  U('photo-1681586745894-a049bcf07499'),
  U('photo-1445979323117-80453f573b71'),
  U('photo-1623130161074-1ec8ec4abaa0'),
  U('photo-1623130180922-77383ed4eee7'),
  U('photo-1623130101592-331d9fb4cde3'),
  U('photo-1623130320585-28986bf80859'),
  U('photo-1623130094330-611c88b31bf6'),
  U('photo-1518779578993-ec3579fee39f'),
]

/** 炒菜（锅气、零散食材） */
const STIR_FRY_POOL = [
  U('photo-1601226809816-b8c32440158a'),
  U('photo-1634141613544-001d33883517'),
  U('photo-1564834724105-918b73d1b9e0'),
  U('photo-1707056503922-91c9ebaf0774'),
  U('photo-1608393189287-0bc2191c7e86'),
  U('photo-1695606452836-c3c6e62d407b'),
  U('photo-1539136788836-5699e78bfc75'),
  U('photo-1547573854-74d2a71d0826'),
  U('photo-1577303935007-0d306ee638cf'),
  U('photo-1540432797114-187727adf19b'),
]

/** 汤类（高汤、清汤、浓汤） */
const SOUP_POOL = [
  U('photo-1645676524836-381f088c4da0'),
  U('photo-1512003867696-6d5ce6835040'),
  U('photo-1685209744214-bbf758d4ae63'),
  U('photo-1700324669194-77400dc8be59'),
  U('photo-1625916231024-11d21e549174'),
  U('photo-1584003397078-45ef96d6174d'),
  U('photo-1623476663364-12de7c8b8b8d'),
  U('photo-1559948271-7d5c98d2e951'),
  U('photo-1666278170490-2b2a71939340'),
]

/** 蒸菜（蒸鱼、蒸排骨、清蒸为主） */
const STEAMED_POOL = [
  U('photo-1773901344817-537194056c1a'),
  U('photo-1760504526044-840cade997b2'),
  U('photo-1773196275043-8d6e367b0bca'),
  U('photo-1762418967889-10abec43c325'),
  U('photo-1767324672653-84c017d85d8e'),
  U('photo-1766582931800-fd79665257fa'),
]

/** 米饭 / 炒饭 / 盖浇饭 */
const RICE_POOL = [
  U('photo-1603133872878-684f208fb84b'),
  U('photo-1512058564366-18510be2db19'),
  U('photo-1596560548464-f010549b84d7'),
  U('photo-1609570324378-ec0c4c9b6ba8'),
  U('photo-1584269600464-37b1b58a9fe7'),
  U('photo-1551326844-4df70f78d0e9'),
  U('photo-1540100716001-4b432820e37f'),
  U('photo-1519996409144-56c88c9aa612'),
  U('photo-1605704931020-ba62cdb2ba9b'),
  U('photo-1605704922285-e82455dba38b'),
]

/** 面条 / 拉面 / 炒面 */
const NOODLE_POOL = [
  U('photo-1612929633738-8fe44f7ec841'),
  U('photo-1585032226651-759b368d7246'),
  U('photo-1600490036275-35f5f1656861'),
  U('photo-1635685296916-95acaf58471f'),
  U('photo-1607328874071-45a9cd600644'),
  U('photo-1565976469791-9cbef1241c1f'),
  U('photo-1609672655400-c509bdbcf7e2'),
  U('photo-1526318896980-cf78c088247c'),
  U('photo-1607095097076-bf0221751ed6'),
  U('photo-1746183055178-e4d5889140f0'),
]

/** 饺子 / 包子 / 馄饨 */
const DUMPLING_POOL = [
  U('photo-1678026582164-24a5460c447a'),
  U('photo-1657939728877-df03de19f9fe'),
  U('photo-1762418967889-10abec43c325'),
  U('photo-1767324672653-84c017d85d8e'),
  U('photo-1747972312960-12925acc5790'),
  U('photo-1651783078053-fc9e8f2ed0e3'),
  U('photo-1666278170520-f4fdd96292ea'),
  U('photo-1588166524938-1ee110d7dcef'),
]

/** 豆腐类（麻婆、家常、皮蛋） */
const TOFU_POOL = [
  U('photo-1722635940350-d1b2e5129379'),
  U('photo-1596352670192-5a95e357df7b'),
  U('photo-1668434344247-5daf7c7aff63'),
  U('photo-1635452066377-6df9b3529b33'),
  U('photo-1544519685-86ccb2dab444'),
]

/** 番茄 / 蛋类家常菜 */
const TOMATO_EGG_POOL = [
  U('photo-1587040324762-6e76782269ac'),
  U('photo-1621800972108-da83d459ae5b'),
  U('photo-1684248182392-4a86313880df'),
  U('photo-1684248182367-714ccd089235'),
  U('photo-1684248182366-6a3ad0df120e'),
  U('photo-1550220287-2fce35a84989'),
]

/** 糖醋 / 红润酸甜（糖醋里脊、咕咾肉、菠萝肉） */
const SWEET_SOUR_POOL = [
  U('photo-1726514733403-905a2c92e96c'),
  U('photo-1537516803400-bf9d09ae3d2f'),
  U('photo-1682622110433-65513a55d7da'),
  U('photo-1654048210720-f1467c024650'),
  U('photo-1623689046286-01d812cc8bad'),
  U('photo-1603246652191-8a6dc2013f40'),
]

/** 火锅 / 麻辣烫 / 干锅 */
const HOTPOT_POOL = [
  U('photo-1614104030967-5ca61a54247b'),
  U('photo-1682496178113-6275890f1fd7'),
  U('photo-1611345157614-26d3bdd10c93'),
  U('photo-1677030137853-03a83b0bd630'),
  U('photo-1608229642114-0061d4e6a9ab'),
  U('photo-1710092867683-fd1d3e6abf7a'),
  U('photo-1688990153652-5f52924e1c52'),
]

/** 早餐 / 粥 / 三明治 / 吐司 */
const BREAKFAST_POOL = [
  U('photo-1484723091739-30a097e8f929'),
  U('photo-1482049016688-2d3e1b311543'),
  U('photo-1715493926880-a15b1fee7b30'),
  U('photo-1567620905732-2d1ec7ab7445'),
  U('photo-1504754524776-8f4f37790ca0'),
  U('photo-1595955809761-dcd4c857e147'),
  U('photo-1623476663364-12de7c8b8b8d'),
  U('photo-1766761562530-c8dd12c96d9a'),
  U('photo-1628085838053-59fbbedef8a9'),
  U('photo-1658041050615-73edd85531db'),
]

/** 沙拉 / 凉菜 / 轻食 */
const SALAD_POOL = [
  U('photo-1512621776951-a57141f2eefd'),
  U('photo-1511994714008-b6d68a8b32a2'),
  U('photo-1617650555983-eaf0230972c2'),
  U('photo-1623669219949-2bb00f351eee'),
  U('photo-1603662953513-5d74185ffb75'),
  U('photo-1603662953530-bcad9631d3fc'),
  U('photo-1623689043695-aec9746be500'),
]

/** 海鲜 / 虾蟹贝类 */
const SEAFOOD_POOL = [
  U('photo-1572406781543-c63cfe136bcf'),
  U('photo-1741933795170-d94014320ff9'),
  U('photo-1672636401225-ec3d4025a4af'),
  U('photo-1672636402078-4b957a572e4e'),
  U('photo-1672636401296-72fefd00e745'),
]

/** 通用 / 兜底（高级感、家常感都有） */
const GENERIC_POOL = [
  U('photo-1546069901-ba9599a7e63c'),
  U('photo-1555939594-58d7cb561ad1'),
  U('photo-1504674900247-0877df9cc836'),
  U('photo-1540189549336-e6e99c3679fe'),
  U('photo-1414235077428-338989a2e8c0'),
  U('photo-1723962807917-ffab0600929c'),
  U('photo-1672106646371-2c70a76d0b1c'),
  U('photo-1745178964606-e8f4818f57b5'),
  U('photo-1677051707499-87ea304987b4'),
  U('photo-1712746783860-94fabfbac42c'),
  U('photo-1571987530791-58e3e7744d99'),
  U('photo-1539735257177-0d3949225f96'),
  U('photo-1467003909585-2f8a72700288'),
  U('photo-1511690656952-34342bb7c2f2'),
  U('photo-1587334207810-4915c4e40c67'),
  U('photo-1591632288574-a387f820a1ca'),
  U('photo-1705948730553-3ea0c89ae6fb'),
  U('photo-1514326640560-7d063ef2aed5'),
  U('photo-1696805566858-fe4a670d5df3'),
  U('photo-1723200295608-fa8efcee6781'),
  U('photo-1565299624946-b28f40a0ae38'),
]

// ========== 2. 关键词 → 池 映射（顺序很重要，先匹配的优先） ==========

interface KeywordRule {
  /** 关键词列表（任一命中即采用对应池） */
  keys: string[]
  pool: string[]
  /** 标签：调试用 */
  label: string
}

const KEYWORD_RULES: KeywordRule[] = [
  // 主食类（最特殊，先判断）
  { label: 'dumpling', keys: ['饺子', '水饺', '蒸饺', '煎饺', '小笼', '包子', '馄饨', '抄手', '云吞', '汤圆'], pool: DUMPLING_POOL },
  { label: 'noodle',   keys: ['面', '面条', '拉面', '炒面', '汤面', '凉面', '拌面', '米线', '粉丝', '粉条', '河粉', '意面', '螺蛳粉', '热干面'], pool: NOODLE_POOL },
  { label: 'rice',     keys: ['炒饭', '盖浇饭', '焖饭', '拌饭', '煲仔饭', '寿司饭', '饭团'], pool: RICE_POOL },
  { label: 'congee',   keys: ['粥', '稀饭'], pool: BREAKFAST_POOL },
  { label: 'breakfast',keys: ['吐司', '三明治', '煎蛋', '荷包蛋', '麦片', '燕麦', '粢饭', '油条', '豆浆', '早餐', '可丽饼', '松饼', '华夫'], pool: BREAKFAST_POOL },

  // 做法类
  { label: 'hotpot',   keys: ['火锅', '麻辣烫', '关东煮', '冒菜', '干锅', '焖锅'], pool: HOTPOT_POOL },
  { label: 'braised',  keys: ['红烧', '卤', '炖', '焖', '煨', '酱烧', '黄焖'], pool: BRAISED_POOL },
  { label: 'steamed',  keys: ['清蒸', '粉蒸', '蒸蛋', '蒸鱼', '蒸排骨', '蒸肉', '蒸蛋羹'], pool: STEAMED_POOL },
  { label: 'sweet-sour', keys: ['糖醋', '咕咾', '咕噜', '菠萝', '茄汁', '酸甜'], pool: SWEET_SOUR_POOL },
  { label: 'soup',     keys: ['汤', '羹', '高汤', '炖盅', '老火'], pool: SOUP_POOL },
  { label: 'salad',    keys: ['沙拉', '凉拌', '凉菜', '生菜', '凉粉'], pool: SALAD_POOL },

  // 主食材类
  { label: 'tofu',     keys: ['豆腐', '麻婆', '皮蛋', '冻豆腐', '臭豆腐', '豆皮'], pool: TOFU_POOL },
  { label: 'tomato-egg', keys: ['番茄炒蛋', '西红柿炒蛋', '西红柿鸡蛋', '番茄蛋', '蛋花'], pool: TOMATO_EGG_POOL },
  { label: 'seafood',  keys: ['虾', '蟹', '贝', '蛤蜊', '扇贝', '蛤', '生蚝', '海鲜', '鲍鱼', '鱿鱼', '章鱼', '螃蟹'], pool: SEAFOOD_POOL },

  // 兜底类
  { label: 'stir-fry', keys: ['炒', '爆', '滑', '小炒', '辣炒', '青椒', '木耳', '芹菜', '杏鲍菇', '土豆丝'], pool: STIR_FRY_POOL },
]

// ========== 3. 精确匹配字典：常见名菜直接锁图 ==========
// 当用户搜「红烧肉」「番茄炒蛋」等高频菜，直接给最对得上的封面

const EXACT_MATCH: Record<string, string> = {
  // 红烧 / 炖煮
  '红烧肉': U('photo-1681586745894-a049bcf07499'),
  '红烧排骨': U('photo-1445979323117-80453f573b71'),
  '红烧牛肉': U('photo-1623130161074-1ec8ec4abaa0'),
  '红烧鸡翅': U('photo-1518779578993-ec3579fee39f'),
  '可乐鸡翅': U('photo-1518779578993-ec3579fee39f'),
  '土豆炖牛肉': U('photo-1623130180922-77383ed4eee7'),
  '黄焖鸡': U('photo-1623130101592-331d9fb4cde3'),

  // 蒸菜
  '清蒸鲈鱼': U('photo-1773901344817-537194056c1a'),
  '清蒸鱼': U('photo-1773901344817-537194056c1a'),
  '剁椒鱼头': U('photo-1760504526044-840cade997b2'),
  '粉蒸排骨': U('photo-1762418967889-10abec43c325'),
  '蒸蛋羹': U('photo-1684248182367-714ccd089235'),
  '水蒸蛋': U('photo-1684248182367-714ccd089235'),

  // 番茄蛋
  '番茄炒蛋': U('photo-1684248182367-714ccd089235'),
  '西红柿炒蛋': U('photo-1684248182367-714ccd089235'),
  '番茄鸡蛋汤': U('photo-1625916231024-11d21e549174'),
  '番茄牛腩': U('photo-1623130161074-1ec8ec4abaa0'),

  // 豆腐类
  '麻婆豆腐': U('photo-1722635940350-d1b2e5129379'),
  '家常豆腐': U('photo-1722635940350-d1b2e5129379'),
  '皮蛋豆腐': U('photo-1596352670192-5a95e357df7b'),

  // 糖醋
  '糖醋里脊': U('photo-1726514733403-905a2c92e96c'),
  '糖醋排骨': U('photo-1654048210720-f1467c024650'),
  '咕咾肉': U('photo-1682622110433-65513a55d7da'),
  '菠萝古老肉': U('photo-1682622110433-65513a55d7da'),

  // 经典炒菜
  '宫保鸡丁': U('photo-1605704931020-ba62cdb2ba9b'),
  '回锅肉': U('photo-1601226809816-b8c32440158a'),
  '青椒肉丝': U('photo-1707056503922-91c9ebaf0774'),
  '鱼香肉丝': U('photo-1601226809816-b8c32440158a'),
  '蚂蚁上树': U('photo-1607328874071-45a9cd600644'),
  '酸辣土豆丝': U('photo-1564834724105-918b73d1b9e0'),
  '干煸豆角': U('photo-1539136788836-5699e78bfc75'),
  '蒜蓉西兰花': U('photo-1539136788836-5699e78bfc75'),
  '清炒时蔬': U('photo-1540432797114-187727adf19b'),
  '清炒菠菜': U('photo-1540432797114-187727adf19b'),

  // 主食
  '蛋炒饭': U('photo-1512058564366-18510be2db19'),
  '扬州炒饭': U('photo-1603133872878-684f208fb84b'),
  '虾仁炒饭': U('photo-1551326844-4df70f78d0e9'),
  '酱油炒饭': U('photo-1596560548464-f010549b84d7'),
  '葱油拌面': U('photo-1635685296916-95acaf58471f'),
  '炸酱面': U('photo-1607328874071-45a9cd600644'),
  '兰州拉面': U('photo-1526318896980-cf78c088247c'),
  '阳春面': U('photo-1645676524836-381f088c4da0'),
  '热干面': U('photo-1635685296916-95acaf58471f'),
  '酸辣粉': U('photo-1700324669194-77400dc8be59'),
  '螺蛳粉': U('photo-1700324669194-77400dc8be59'),
  '猪肉白菜饺': U('photo-1657939728877-df03de19f9fe'),
  '速冻水饺': U('photo-1762418967889-10abec43c325'),
  '小笼包': U('photo-1678026582164-24a5460c447a'),
  '生煎包': U('photo-1747972312960-12925acc5790'),
  '馄饨': U('photo-1746183055178-e4d5889140f0'),

  // 汤
  '紫菜蛋花汤': U('photo-1625916231024-11d21e549174'),
  '玉米排骨汤': U('photo-1584003397078-45ef96d6174d'),
  '冬瓜排骨汤': U('photo-1645676524836-381f088c4da0'),
  '丝瓜蛋汤': U('photo-1685209744214-bbf758d4ae63'),
  '酸辣汤': U('photo-1700324669194-77400dc8be59'),
  '萝卜牛腩汤': U('photo-1584003397078-45ef96d6174d'),

  // 早餐
  '牛油果吐司': U('photo-1484723091739-30a097e8f929'),
  '香蕉奶昔': U('photo-1715493926880-a15b1fee7b30'),
  '燕麦杯': U('photo-1715493926880-a15b1fee7b30'),
  '小米粥': U('photo-1623476663364-12de7c8b8b8d'),
  '皮蛋瘦肉粥': U('photo-1766761562530-c8dd12c96d9a'),

  // 海鲜
  '油焖大虾': U('photo-1741933795170-d94014320ff9'),
  '白灼虾': U('photo-1572406781543-c63cfe136bcf'),
  '蒜蓉粉丝蒸虾': U('photo-1741933795170-d94014320ff9'),

  // 沙拉
  '鸡胸肉轻食沙拉': U('photo-1512621776951-a57141f2eefd'),
  '凉拌黄瓜': U('photo-1623689043695-aec9746be500'),
  '凉拌木耳': U('photo-1603662953513-5d74185ffb75'),
  '手撕鸡': U('photo-1611345157614-26d3bdd10c93'),

  // 火锅
  '麻辣火锅': U('photo-1614104030967-5ca61a54247b'),
  '番茄火锅': U('photo-1688990153652-5f52924e1c52'),
}

// ========== 4. 简易稳定 hash（同名菜每次取同一张图） ==========

function stableHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function pickFromPool(pool: string[], seed: string): string {
  if (pool.length === 0) return GENERIC_POOL[0]
  return pool[stableHash(seed) % pool.length]
}

// ========== 5. 对外主函数 ==========

/**
 * 给菜谱挑一张配图：
 *   1. 命中 EXACT_MATCH 直接返回；
 *   2. 命中关键词规则 → 在对应池里按菜名 hash 稳定取一张；
 *   3. 都不中 → GENERIC_POOL 兜底。
 *
 * 注意：函数是纯函数，相同输入永远得到相同结果，便于缓存与跨设备一致。
 */
export function pickDishImage(title: string, tags?: string[]): string {
  const t = (title || '').trim()
  if (!t) return pickFromPool(GENERIC_POOL, tags?.join('|') || '家常菜')

  const exactOverride = EXACT_DISH_IMAGE_OVERRIDES[t]
  if (exactOverride) return exactOverride

  const exact = EXACT_MATCH[t]
  if (exact) return exact

  for (const rule of KEYWORD_RULES) {
    if (rule.keys.some((key) => t.includes(key) || tags?.some((tag) => tag.includes(key)))) {
      return pickFromPool(rule.pool, `${rule.label}:${t}`)
    }
  }

  return pickFromPool(GENERIC_POOL, t)
}

/** 为统计 / 调试用：返回命中的规则标签（如未命中关键词返回 'generic'） */
export function explainDishImage(title: string, tags?: string[]): string {
  const t = (title || '').trim()
  if (!t) return 'empty'
  if (EXACT_DISH_IMAGE_OVERRIDES[t]) return 'exact-real'
  if (EXACT_MATCH[t]) return 'exact'
  const rule = KEYWORD_RULES.find((item) =>
    item.keys.some((key) => t.includes(key) || tags?.some((tag) => tag.includes(key)))
  )
  return rule?.label ?? 'generic'
}
