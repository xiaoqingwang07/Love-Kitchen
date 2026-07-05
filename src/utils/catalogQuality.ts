/**
 * 运行时 catalog 质量评分（与 scripts/lib/catalog-quality-rules.mjs 规则对齐）
 */
import type { Recipe, Ingredient } from '../types/recipe'

const TITLE_EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u2600-\u27BF‼️❗️🔥✨💯👍]/u
const TITLE_EMOJI_RE_G = /[\u{1F300}-\u{1FAFF}\u2600-\u27BF‼️❗️🔥✨💯👍]/gu
const TITLE_MARKETING_RE =
  /无敌|三碗|绝绝|绝绝子|爆款|神仙|神仙吃法|神仙饮品|下饭菜|舔盘|舔手指|舔碗|YYDS|yyds|秒杀|秒杀路边摊|秒杀吉野家|秒杀哈根达斯|秒杀外面|巨好|巨好喝|天花板|破天荒|香哭了|好吃到|比外面卖的|比肉还好吃|比饭店好吃|比慕斯|被惊艳|亲戚家|全蛋️|今天这个|简直不|补钙神器|超下饭|超好吃|最好吃|好吃的|简单好吃|粉嘟嘟|同款|产品|复刻|好喝到舔碗底|锁死这个配方|教你在家做|卖了十几年|阿姨教我做|我妈的拿手菜|羽毛般|柔软拉丝|奶呼呼|学校门口|吃一次就爱上|超级好吃的|入口即化|真的无敌|三碗米饭|无敌下饭|做法简单|0失败|无需打发|夏日神仙|自制夏日|私房爆款|岩烧乳酪|开胃解腻|解腻又好吃|透心凉|灵魂做法|轻食店|甜品店|一切甜品|柠檬巴巴露亚|半熟芝士|哈根达斯|吉野家|这样做的|拿肉都不换|免烤|搅一搅就成功|新手一次成功|软糯Q弹|冰冰凉凉|真的爱了|村驴老师|老师的|作者|博主|阿姨|妈妈|我妈|亲戚|家庭必备|饭扫光|百吃不厌|零失败|新手轻松做|家庭版|超好喝|万能低脂|咸香咸香的/

/** 首页/Profile 精品池：帖子感、人称来源、烘焙甜品等 */
const PREMIUM_PLATFORM_RE =
  /这样做的|拿肉都不换|免烤|搅一搅就成功|新手一次成功|软糯Q弹|冰冰凉凉|真的爱了|村驴老师|老师的|作者|博主|阿姨|妈妈|我妈|亲戚|大理石纹|家庭必备|饭扫光|百吃不厌|零失败|新手轻松做|家庭版|超好喝|万能低脂|咸香咸香的|造起来|夏日开胃|小凉菜|嘬手指|只需三样食材|香到|万能的|配方|爽口又开胃/

const PREMIUM_DESSERT_BAKE_RE =
  /慕斯|蛋糕|烘焙|甜点|点心|曲奇|饼干|布丁|泡芙|蛋挞|瑞士卷|虎皮卷|舒芙蕾|铜锣烧|华夫|可颂|贝果|吐司|松饼|奶冻|雪媚娘|凉糕|糯米凉糕|烤牛奶|烤奶|牛奶甜品|奶香浓郁|双皮奶|甜牛奶/

/** 非完整菜品：酱料、料汁、腌小菜、馅料、半成品等 */
const PREMIUM_NOT_FULL_DISH_RE =
  /的酱$|(?:万能)?(?:拌)?料汁|万能拌料|(?:万能)?(?:拌)?调料|万能调料|蘸料|腌料|拌料|馅料|半成品|^酱$|酱汁|配方/

const PREMIUM_PICKLE_SIDE_RE = /^腌(?:黄瓜|萝卜|椒|菜|蒜|姜|大头菜)/

/** 泛化兜底标题（catalog 可保留，精品池禁止） */
export const GENERIC_FALLBACK_TITLES = [
  '精选小炒',
  '素香小炒',
  '荤香小炒',
  '奶香小点',
  '香卤小食',
  '海鲜小炒',
] as const

const PREMIUM_ADJECTIVE_PHRASE_RE =
  /^(?:爽口|开胃|又香又|超(?:好|香)|真的(?:好|香)|巨好|香到)|又开胃$|造起来$|小凉菜$/

const QUOTE_CONTENT_RE =
  /[""「『""\u201c\u201d]([^\u201d""」』""\u201c\n]{2,14})[""」』""\u201c\u201d]/
const INGREDIENT_SECTION_RE = /^[#＃【]|：$|^油酥|^面团|^馅料|^步骤|^材料/
const VALID_IMAGE_RE = /^https?:\/\/.+/i
const DISH_LIKE_RE = /[拌炒炖煮蒸爆焖卤煎烤烧]|[^的]{2,10}(?:丝|片|块|条|饭|汤|面|肉|鱼|虾|豆腐|菜|串|爪|骨|鸭|鸡|牛|猪)/

export function hasTitleIssue(title: string): boolean {
  const t = title.trim()
  if (!t) return true
  if (t.length > 24) return true
  const emojiHits = (t.match(TITLE_EMOJI_RE_G) || []).length
  if (emojiHits >= 2) return true
  if (/!{2,}|！{2,}/.test(t)) return true
  if (TITLE_MARKETING_RE.test(t)) return true
  return false
}

/** 面向首页展示的标题是否仍带平台/帖子感 */
export function hasPremiumDisplayIssue(title: string): boolean {
  const t = title.trim()
  if (!t) return true
  if (/^的/.test(t)) return true
  if (hasTitleIssue(t)) return true
  if (PREMIUM_PLATFORM_RE.test(t)) return true
  return false
}

/** 是否为完整菜品（首页精品池仅推荐完整菜） */
export function isGenericFallbackTitle(title: string): boolean {
  return (GENERIC_FALLBACK_TITLES as readonly string[]).includes(title.trim())
}

export function isPremiumFullDish(title: string): boolean {
  const t = title.trim()
  if (!t) return false
  if (isGenericFallbackTitle(t)) return false
  if (PREMIUM_NOT_FULL_DISH_RE.test(t)) return false
  if (PREMIUM_PICKLE_SIDE_RE.test(t)) return false
  if (PREMIUM_ADJECTIVE_PHRASE_RE.test(t)) return false
  if (PREMIUM_PLATFORM_RE.test(t)) return false
  if (/^[""「『""\u201c\u201d].*[""」』""\u201c\u201d]/.test(t)) return false
  if (/^.{1,4}店$/.test(t)) return false
  if (!DISH_LIKE_RE.test(t)) return false
  return true
}

function stripMarketingTokens(text: string): string {
  let t = text
    .replace(TITLE_EMOJI_RE_G, '')
    .replace(/[～~].*(秒杀|巨好|比外面卖的|烧烤店|路边摊).*$/i, '')
    .replace(/^好吃到(?:舔盘|舔手指)?的?/gi, '')
    .replace(/好吃到(?:舔盘|舔手指)?的?/gi, '')
    .replace(/^在亲戚家吃过一回[，,]?被惊艳了[…\.]*/i, '')
    .replace(/^全蛋️?无芝士❗?️?/i, '')
    .replace(/^下饭菜里的天花板\s+/i, '')
    .replace(/^下饭菜[""「『]([^""」』]+)[""」』].*$/i, '$1')
    .replace(/^家庭下饭菜[｜|]\s*/i, '')
    .replace(/^比外面卖的/i, '')
    .replace(/^比饭店好吃的/i, '')
    .replace(/^比肉还好吃的/i, '')
    .replace(/^比慕斯还好吃的/i, '')
    .replace(/^入口即化[❗!️]*/i, '')
    .replace(/^真的无敌好吃的/i, '')
    .replace(/^超级无敌好吃的/i, '')
    .replace(/^三碗米饭还不够[❗!️]*/i, '')
    .replace(/^无敌下饭的/i, '')
    .replace(/^简单好吃的/i, '')
    .replace(/^无需打发[❗!️]*/i, '')
    .replace(/^秒杀吉野家的/i, '')
    .replace(/^秒杀哈根达斯的/i, '')
    .replace(/^秒杀外面/i, '')
    .replace(/^自制夏日神仙饮品/i, '')
    .replace(/^夏日神仙饮品/i, '')
    .replace(/^自制.*?饮品/i, '')
    .replace(/^好吃到舔碗的/i, '')
    .replace(/^私房爆款[🔥]*/i, '')
    .replace(/^开胃解腻又好吃的/i, '')
    .replace(/^在亲戚家吃过一回.*$/i, '')
    .replace(/^鲜香味美[！!]?/i, '')
    .replace(/^外焦里嫩[！!]?/i, '')
    .replace(/^低脂低卡/i, '')
    .replace(/^卖了十几年(.+?)的阿姨教我做的[…\.]*/i, '$1')
    .replace(/^我妈的拿手菜[！!]?/i, '')
    .replace(/羽毛般柔软拉丝\s*[|｜]\s*奶呼呼的[^|｜]*/i, '')
    .replace(/^锁死这个配方[，,]?\s*(?:超级好吃的)?/i, '')
    .replace(/^学校门口/i, '')
    .replace(/^.里的天花板\s+/i, '')
    .replace(/的天花板.*$/i, '')
    .replace(/-下饭菜$/i, '')
    .replace(/[，,].*(无敌|三碗|绝绝|爆款|舔盘|舔手指|下饭菜|秒杀|巨好|被惊艳|亲戚家|天花板|巨好喝|今天这个|简直不|补钙神器|超下饭|粉嘟嘟|同款|复刻|吃一次就爱上|路边摊|舔碗底|教你在家做).*$/i, '')
    .replace(/^今天这个[！!]?/i, '')
    .replace(/简直不(?:要|用)?/gi, '')
    .replace(/^补钙神器/i, '')
    .replace(/超下饭/gi, '')
    .replace(/超好吃/gi, '')
    .replace(/最好吃/gi, '')
    .replace(/超级好吃的/gi, '')
    .replace(/^好吃的/i, '')
    .replace(/粉嘟嘟/gi, '')
    .replace(/同款/gi, '')
    .replace(/复刻/gi, '')
    .replace(/产品/gi, '')
    .replace(/绝绝子/gi, '')
    .replace(/神仙吃法/gi, '')
    .replace(/好喝到舔碗底/gi, '')
    .replace(/锁死这个配方/gi, '')
    .replace(/教你在家做/gi, '')
    .replace(/吃一次就爱上/gi, '')
    .replace(/秒杀路边摊/gi, '')
    .replace(/卖了十几年/gi, '')
    .replace(/阿姨教我做的/gi, '')
    .replace(/我妈的拿手菜/gi, '')
    .replace(/羽毛般/gi, '')
    .replace(/柔软拉丝/gi, '')
    .replace(/奶呼呼/gi, '')
    .replace(/做法简单0失败/gi, '')
    .replace(/做法简单/gi, '')
    .replace(/0失败/gi, '')
    .replace(/灵魂做法/gi, '')
    .replace(/一切甜品店/gi, '')
    .replace(/一切甜品/gi, '')
    .replace(/透心凉/gi, '')
    .replace(/天花板吃法/gi, '')
    .replace(/的天花板/gi, '')
    .replace(/学校门口/gi, '')
    .replace(/^这样做的/gi, '')
    .replace(/拿肉都不换/gi, '')
    .replace(/^拿肉都不换的/gi, '')
    .replace(/^免烤[️\uFE0F]?/gi, '')
    .replace(/搅一搅就成功/gi, '')
    .replace(/新手一次成功/gi, '')
    .replace(/软糯Q弹/gi, '')
    .replace(/冰冰凉凉/gi, '')
    .replace(/真的爱了/gi, '')
    .replace(/^[\u4e00-\u9fa5]{1,10}老师的(?=[\u4e00-\u9fa5])/gi, '')
    .replace(/^(?:作者|博主)[：:]?\s*/gi, '')
    .replace(/^我妈的/gi, '')
    .replace(/^亲戚(?:家)?的/gi, '')
    .replace(/^大理石纹/gi, '')
    .replace(/^家庭版[～~]?/gi, '')
    .replace(/^家常快手/gi, '')
    .replace(/简单好做$/gi, '')
    .replace(/^家庭必备/gi, '')
    .replace(/之饭扫光.*$/gi, '')
    .replace(/饭扫光/gi, '')
    .replace(/百吃不厌/gi, '')
    .replace(/零失败/gi, '')
    .replace(/新手轻松做/gi, '')
    .replace(/造起来/gi, '')
    .replace(/^只需三样食材的/gi, '')
    .replace(/^香到嘬手指的/gi, '')
    .replace(/^夏日开胃小凉菜/gi, '')
    .replace(/^巨鲜美的/gi, '')
    .replace(/孩子们的最爱/gi, '')
    .replace(/燉/g, '炖')
    .replace(/^的+/g, '')
    .replace(/^(?:巨好(?:喝|吃)?|[！!])+/, '')
    .replace(/[!！]+/g, '！')
    .replace(/[～~]+$/g, '')
    .replace(/[…\.]+$/g, '')
    .replace(/[！!|｜|]+$/g, '')
    .trim()
  if (TITLE_MARKETING_RE.test(t)) {
    t = t
      .replace(/下饭菜/g, '')
      .replace(/天花板/g, '')
      .replace(/巨好(?:喝|吃)?/g, '')
      .replace(/今天这个/g, '')
      .replace(/简直不(?:要|用)?/g, '')
      .replace(/补钙神器/g, '')
      .replace(/超下饭/g, '')
      .replace(/超好吃/g, '')
      .replace(/最好吃/g, '')
      .replace(/超级好吃的/g, '')
      .replace(/^好吃的/, '')
      .replace(/粉嘟嘟/g, '')
      .replace(/同款/g, '')
      .replace(/复刻/g, '')
      .replace(/产品/g, '')
      .replace(/绝绝子/g, '')
      .replace(/神仙吃法/g, '')
      .replace(/好喝到舔碗底/g, '')
      .replace(/锁死这个配方/g, '')
      .replace(/教你在家做/g, '')
      .replace(/吃一次就爱上/g, '')
      .replace(/秒杀路边摊/g, '')
      .replace(/卖了十几年/g, '')
      .replace(/阿姨教我做的/g, '')
      .replace(/我妈的拿手菜/g, '')
      .replace(/羽毛般柔软拉丝/g, '')
      .replace(/奶呼呼/g, '')
      .replace(/学校门口/g, '')
      .trim()
  }
  return t
}

function pickBestSegment(title: string): string {
  const segments = title
    .split(/[！!|｜|、,，]+/)
    .map((s) => stripMarketingTokens(s).replace(/^大理石纹/, ''))
    .filter((s) => s.length >= 2)
  const clean = segments
    .map((s) => (s.length > 16 ? `${s.slice(0, 14)}…` : s))
    .filter((s) => s.length >= 2 && s.length <= 16 && !hasTitleIssue(s) && !PREMIUM_PLATFORM_RE.test(s))
  if (!clean.length) return ''
  const withCook = clean.find((s) => DISH_LIKE_RE.test(s))
  if (withCook) return withCook
  return clean.sort((a, b) => b.length - a.length)[0]
}

function extractDishFallback(title: string): string {
  const aunt = title.match(/卖了十几年(.+?)的阿姨教我做的/)
  if (aunt) {
    const core = stripMarketingTokens(aunt[1])
    if (core.length >= 2 && !hasTitleIssue(core)) return core.length > 16 ? `${core.slice(0, 14)}…` : core
  }
  const quotedInline = title.match(QUOTE_CONTENT_RE)
  if (quotedInline) {
    const core = stripMarketingTokens(quotedInline[1].replace(TITLE_EMOJI_RE_G, ''))
    if (core.length >= 2 && !hasTitleIssue(core)) return core.length > 16 ? `${core.slice(0, 14)}…` : core
  }
  const needOnly = title.match(/只需(?:三样)?(?:食材的)?([烧炖煲炒煮蒸][\u4e00-\u9fa5]{1,6})/)
  if (needOnly) {
    const core = stripMarketingTokens(needOnly[1])
    if (core.length >= 2 && !hasTitleIssue(core)) return core.length > 16 ? `${core.slice(0, 14)}…` : core
  }
  const fanMatch = title.match(/([\u4e00-\u9fa5]{2,10}饭)造起来/)
  if (fanMatch) {
    const core = stripMarketingTokens(fanMatch[1])
    if (core.length >= 2 && !hasTitleIssue(core)) return core.length > 16 ? `${core.slice(0, 14)}…` : core
  }
  const match = title.match(
    /(?:[拌炒炖煮蒸爆焖卤煎烤烧][\u4e00-\u9fa5]{1,12}|[\u4e00-\u9fa5]{2,10}(?:丝|片|块|条|饭|汤|面|肉|鱼|虾|豆腐|菜|串|爪|骨|鸭|鸡|牛|猪|瓜|虾|排|瓜))/
  )
  if (match) {
    const core = stripMarketingTokens(match[0])
    if (core.length >= 2 && !hasTitleIssue(core)) return core.length > 16 ? `${core.slice(0, 14)}…` : core
  }
  return ''
}

function extractQuotedDish(title: string): string {
  const bracket = title.match(QUOTE_CONTENT_RE)
  if (bracket) {
    const core = stripMarketingTokens(bracket[1].replace(TITLE_EMOJI_RE_G, ''))
    if (core.length >= 2 && !hasTitleIssue(core)) return core
  }
  return ''
}

const BARE_MARKETING_SCRUB_RE =
  /亲戚家|被惊艳|羽毛般|柔软拉丝|奶呼呼|拉丝|柔软|神仙|爆款|绝绝|天花板|秒杀|舔盘|巨好|好吃到|下饭菜|无敌|三碗|简单好吃|入口即化|吃过一回/g

/** 纯营销标题无菜名时的兜底，避免空标题 */
function resolveBareMarketingTitle(title: string): string {
  let zh = stripMarketingTokens(title.replace(/[^\u4e00-\u9fa5]/g, ''))
  zh = zh.replace(BARE_MARKETING_SCRUB_RE, '').trim()
  if (zh.length >= 2 && !hasTitleIssue(zh)) {
    return zh.length > 16 ? `${zh.slice(0, 14)}…` : zh
  }
  if (/奶|布丁|塔/.test(title)) return '奶香小点'
  if (/爪|鸡/.test(title)) return '香卤小食'
  if (/虾|鱼|鱿/.test(title)) return '海鲜小炒'
  if (/肉|排|骨|鸭/.test(title)) return '荤香小炒'
  if (/菜|丝|藕|豆|茄|椒/.test(title)) return '素香小炒'
  return '精选小炒'
}

const PLATFORM_DISH_TAG_SUFFIX_RE = /^([\u4e00-\u9fa5A-Za-z0-9]{2,14})[｜|](?:家常小炒|家常菜|快手菜)$/

export function cleanDisplayTitle(title: string): string {
  const platformTagMatch = title.match(PLATFORM_DISH_TAG_SUFFIX_RE)
  if (platformTagMatch) {
    const core = stripMarketingTokens(platformTagMatch[1])
    if (core.length >= 2 && !hasTitleIssue(core)) {
      return core.length > 16 ? `${core.slice(0, 14)}…` : core
    }
  }
  const flavorMatch = title.match(/^自制([\u4e00-\u9fa5]{2,12})，味道绝了/)
  if (flavorMatch) {
    const core = stripMarketingTokens(flavorMatch[1])
    if (core.length >= 2 && !hasTitleIssue(core)) {
      return core.length > 16 ? `${core.slice(0, 14)}…` : core
    }
  }
  const doingMatch = title.match(/这样做的([\u4e00-\u9fa5]{1,6})拿肉都不换/)
  if (doingMatch) {
    const core = doingMatch[1]
    const guess = core.length <= 3 ? `家常${core}` : `${core}小炒`
    if (guess.length >= 2 && !hasTitleIssue(guess)) {
      return guess.length > 16 ? `${guess.slice(0, 14)}…` : guess
    }
  }
  const swapMatch = title.match(/拿肉都不换的([\u4e00-\u9fa5]{2,10})/)
  if (swapMatch) {
    const core = stripMarketingTokens(swapMatch[1])
    if (core.length >= 2 && !hasTitleIssue(core)) {
      return core.length > 16 ? `${core.slice(0, 14)}…` : core
    }
  }
  const teacherMatch = title.match(/^[\u4e00-\u9fa5]{1,10}老师的(.+)/)
  if (teacherMatch) {
    const core = stripMarketingTokens(teacherMatch[1])
    if (core.length >= 2 && !hasTitleIssue(core)) {
      return core.length > 16 ? `${core.slice(0, 14)}…` : core
    }
  }
  const stewMatch = title.match(/([\u4e00-\u9fa5]{2,8}(?:炖|燉)[\u4e00-\u9fa5]{1,6})/)
  if (stewMatch) {
    const core = stripMarketingTokens(stewMatch[1]).replace(/燉/g, '炖')
    if (core.length >= 3 && !hasTitleIssue(core)) {
      return core.length > 16 ? `${core.slice(0, 14)}…` : core
    }
  }
  const quoted = extractQuotedDish(title)
  if (quoted) return quoted.length > 16 ? `${quoted.slice(0, 14)}…` : quoted
  const strippedEarly = stripMarketingTokens(title)
  if (
    strippedEarly.length >= 2 &&
    strippedEarly.length <= 16 &&
    !hasTitleIssue(strippedEarly) &&
    DISH_LIKE_RE.test(strippedEarly) &&
    !PREMIUM_ADJECTIVE_PHRASE_RE.test(strippedEarly)
  ) {
    return strippedEarly
  }
  const extracted = extractDishFallback(title)
  if (extracted && !hasTitleIssue(extracted)) return extracted
  let t = stripMarketingTokens(title)
  const segment = pickBestSegment(title)
  if (segment) t = segment
  if (t.length > 16) t = `${t.slice(0, 14)}…`
  if (t.length >= 2 && !hasTitleIssue(t) && DISH_LIKE_RE.test(t) && !PREMIUM_ADJECTIVE_PHRASE_RE.test(t)) {
    return t
  }
  const fallback = stripMarketingTokens(title.slice(0, 32))
  if (
    fallback.length >= 2 &&
    !hasTitleIssue(fallback) &&
    DISH_LIKE_RE.test(fallback) &&
    !PREMIUM_ADJECTIVE_PHRASE_RE.test(fallback)
  ) {
    return fallback.length > 16 ? `${fallback.slice(0, 14)}…` : fallback
  }
  if (t.length === 1 && /[\u4e00-\u9fa5]/.test(t)) return `${t}做法`
  const zhOnly = stripMarketingTokens(title.replace(/[^\u4e00-\u9fa5]/g, ''))
  if (zhOnly.length >= 2 && !hasTitleIssue(zhOnly) && DISH_LIKE_RE.test(zhOnly)) {
    return zhOnly.length > 16 ? `${zhOnly.slice(0, 14)}…` : zhOnly
  }
  return resolveBareMarketingTitle(title)
}

export function hasTimeIssue(recipe: Recipe): boolean {
  const time = Number(recipe.time) || 0
  const steps = recipe.steps?.length ?? 0
  const ingCount = recipe.ingredients?.length ?? 0
  if (recipe.difficulty === '复杂' && time > 0 && time <= 5) return true
  if (steps >= 6 && time > 0 && time <= 5) return true
  if (ingCount >= 10 && time > 0 && time <= 8) return true
  return false
}

export function estimateMinTime(recipe: Recipe): number {
  const time = Number(recipe.time) || 0
  const steps = recipe.steps?.length ?? 0
  const ingCount = recipe.ingredients?.length ?? 0
  return Math.max(time, Math.ceil(steps * 2 + ingCount * 0.5))
}

function hasIngredientIssue(ing: Ingredient): boolean {
  const name = String(ing.name || '').trim()
  const amount = String(ing.amount || '').trim()
  if (!name) return true
  if (INGREDIENT_SECTION_RE.test(name)) return true
  if (name.length > 20 && !amount) return true
  if (/^#/.test(name)) return true
  return false
}

function countIngredientIssues(recipe: Recipe): number {
  return (recipe.ingredients || []).filter(hasIngredientIssue).length
}

function countBadStepUrls(recipe: Recipe): number {
  return (recipe.steps || []).filter((s) => s.image && !VALID_IMAGE_RE.test(s.image)).length
}

export function computeQualityScore(recipe: Recipe, imageDupCount = 1): number {
  let score = 100
  const originalTitle = String(recipe.originalTitle || recipe.title || '')
  const display = recipe.displayTitle || cleanDisplayTitle(originalTitle)
  if (display !== originalTitle.trim()) score -= 4
  if (hasTitleIssue(originalTitle)) score -= 15
  if (hasTitleIssue(display)) score -= 12
  if (hasTimeIssue(recipe)) score -= 20
  const badIng = countIngredientIssues(recipe)
  if (badIng > 0) score -= Math.min(25, badIng * 8)
  if (countBadStepUrls(recipe) > 0) score -= 30
  if (imageDupCount > 50) score -= 35
  else if (imageDupCount > 10) score -= Math.min(20, Math.floor(imageDupCount / 3))
  if ((recipe.rating || 0) >= 8) score += 3
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function sanitizeIngredients(ingredients: Ingredient[]): Ingredient[] {
  if (!Array.isArray(ingredients)) return []
  const out: Ingredient[] = []
  for (const ing of ingredients) {
    if (!ing) continue
    let name = String(ing.name || '').trim()
    const amount = String(ing.amount || '').trim()
    if (!name) continue
    if (INGREDIENT_SECTION_RE.test(name)) continue
    if (/^#/.test(name)) continue
    if (/^[#＃【].*[】]$/.test(name)) continue
    if (name.length > 28 && !amount) continue
    if (name.includes('：') && name.length < 8) continue
    name = name.replace(/^[#＃【]+/, '').replace(/[】]+$/, '').trim()
    if (!name) continue
    out.push({ name: name.slice(0, 24), amount: amount || '适量' })
  }
  return out.slice(0, 20)
}

export function enrichRecipeQuality(recipe: Recipe, imageDupCount = 1): Recipe {
  const originalTitle = recipe.originalTitle || recipe.title
  const displayTitle = recipe.displayTitle || cleanDisplayTitle(originalTitle)
  let time = recipe.time
  if (hasTimeIssue(recipe)) time = estimateMinTime(recipe)
  const ingredients = sanitizeIngredients(recipe.ingredients || [])
  const qualityScore =
    recipe.qualityScore ??
    computeQualityScore(
      { ...recipe, originalTitle, time, displayTitle, title: originalTitle, ingredients },
      imageDupCount
    )
  return {
    ...recipe,
    originalTitle,
    displayTitle,
    title: displayTitle || originalTitle,
    time,
    ingredients,
    qualityScore,
  }
}

/** 构建封面图复用计数，用于批量 enrich */
export function buildImageDupMap(recipes: Recipe[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const r of recipes) {
    const img = r.image?.trim()
    if (!img) continue
    map.set(img, (map.get(img) || 0) + 1)
  }
  return map
}

export const MIN_RECOMMEND_QUALITY = 60

export function isRecommendable(recipe: Recipe): boolean {
  return (recipe.qualityScore ?? 100) >= MIN_RECOMMEND_QUALITY
}

/** 首页 / Profile 等面向用户的精品推荐池 */
export function isPremiumDisplayRecipe(recipe: Recipe): boolean {
  const originalTitle = String(recipe.originalTitle || recipe.title || '')
  const displayTitle = String(recipe.displayTitle || cleanDisplayTitle(originalTitle))
  const title = String(recipe.title || '')
  const combined = `${originalTitle} ${displayTitle} ${title}`
  if (!isRecommendable(recipe)) return false
  if ((recipe.qualityScore ?? 100) < 80) return false
  if (isGenericFallbackTitle(displayTitle)) return false
  if (title && isGenericFallbackTitle(title)) return false
  if (hasPremiumDisplayIssue(displayTitle)) return false
  if (title && title !== displayTitle && hasPremiumDisplayIssue(title)) return false
  if (!isPremiumFullDish(displayTitle)) return false
  if (title && title !== displayTitle && !isPremiumFullDish(title)) return false
  if (PREMIUM_DESSERT_BAKE_RE.test(combined)) return false
  if (PREMIUM_NOT_FULL_DISH_RE.test(originalTitle)) return false
  if (/万能|配方|酱汁|料汁|蘸料|腌料|馅料|调料/.test(originalTitle)) return false
  if (
    hasPremiumDisplayIssue(originalTitle) &&
    hasPremiumDisplayIssue(cleanDisplayTitle(originalTitle))
  ) {
    return false
  }
  return true
}
