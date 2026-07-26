/**
 * 淡雅暖色（Warm Calm）：暖白底 + 杏橙主色 + 暖灰文字。
 * 2026-07-26 改造：降饱和、去纯黑、拉开字号跨度、圆角收敛三档、去阴影靠留白分层。
 * 键名与旧版完全一致，所有页面零改动即同步换肤。
 */
export const D = {
  // ===== 背景 =====
  bg: '#FDFCFB',
  bgElevated: '#FFFFFF',
  bgGrouped: '#F7F4F1',
  bgGlass: 'rgba(255, 255, 255, 0.88)',
  bgGlassHeavy: 'rgba(255, 255, 255, 0.94)',

  // ===== 分隔线 =====
  separator: '#F5F1ED',
  separatorLight: 'rgba(58, 52, 46, 0.05)',

  // ===== 文字（暖灰，非纯黑）=====
  label: '#3A342E',
  labelSecondary: '#BEB6AE',
  labelTertiary: '#C6BFB8',

  // ===== 强调色（杏橙）=====
  accent: '#E89562',
  accentMuted: '#FEF8F3',
  accentLine: 'rgba(232, 149, 98, 0.20)',
  // 深一档暖橙：临期高亮 / 需要更强对比时使用
  accentWarm: '#DE8A5A',
  accentWarmMuted: '#FDF4EC',
  /**
   * 橙底之上的文字色。白字配浅杏橙仅 2.36:1，远低于 4.5:1 可读标准；
   * 改用深褐后达 5.21:1，且底色保持原样不变重。
   */
  onAccent: '#3A342E',
  /**
   * 浅底之上的橙色文字/图标。D.accent 直接当文字色在白底只有 2.36:1，
   * 加深至 3.13:1 才满足非正文 UI 元素的 3:1 门槛。
   */
  accentDeep: '#D4783F',

  // ===== 语义色（同步降饱和）=====
  blue: '#5B8DBE',
  green: '#7FA88C',
  red: '#D9736A',
  orange: '#E89562',
  purple: '#9B8AC4',

  // ===== 标签色 =====
  tagMutedFg: '#BEB6AE',
  tagMutedBg: '#F7F4F1',

  // ===== 冰箱柜体（冷冻=冷调 / 冷藏=绿调，语义色，已降饱和以融入暖色系）=====
  freezerAccent: '#7E9BB5',
  freezerDeep: '#3D5468',
  freezerPanel: 'linear-gradient(168deg, #E7EDF3 0%, #DCE5EE 30%, #D2DCE7 62%, #C6D2DF 100%)',
  chillAccent: '#8AA189',
  chillDeep: '#41543F',
  chillPanel: 'linear-gradient(168deg, #EDF2EC 0%, #E4EBE3 30%, #DAE3D8 62%, #CEDACC 100%)',

  // ===== 错误 =====
  errorBg: '#FDF4F2',
  errorAccent: '#D9736A',
  errorFg: '#C25A50',

  // ===== 圆角（三档：小元素 14 / 卡片 18 / 胶囊 999）=====
  radiusS: 14,
  radiusM: 18,
  radiusL: 18,
  radiusXL: 18,
  radiusPill: 999,

  // ===== 阴影（几乎去除，靠留白分层）=====
  shadowCard: 'none',
  shadowLift: '0 8px 28px rgba(58, 52, 46, 0.06)',

  // ===== 间距 =====
  pagePadH: 22,
  pagePadTop: 20,

  // ===== 烹饪模式（暖调深色）=====
  cookingBg: '#22201D',
  cookingSurface: '#2F2C28',
  cookingText: '#F7F4F1',
  cookingMuted: 'rgba(247, 244, 241, 0.55)',

  // ===== 字号 — 拉开跨度以建立层次 =====
  titleLarge: 31,      // 页面大标题
  title: 24,           // 次级标题
  headline: 20,        // 主角（菜名等）
  body: 15,            // 正文
  callout: 15,
  subheadline: 13.5,
  footnote: 12.5,      // 说明
  caption: 10.5,       // 分组标签
  caption2: 10,

  // ===== 字重（整体减一档，苹果大标题并不粗）=====
  weightRegular: '400',
  weightMedium: '500',
  weightSemibold: '600',
  weightBold: '600',
  weightHeavy: '700',
} as const
