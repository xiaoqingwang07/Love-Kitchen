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

  // ===== 语义色（同步降饱和）=====
  blue: '#5B8DBE',
  green: '#7FA88C',
  red: '#D9736A',
  orange: '#E89562',
  purple: '#9B8AC4',

  // ===== 标签色 =====
  tagMutedFg: '#BEB6AE',
  tagMutedBg: '#F7F4F1',

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
