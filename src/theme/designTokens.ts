/**
 * 鲜活食欲（Fresh Appetite）：干净中性白底 + 鲜绿主色 + 番茄橙高亮。
 * 沿用 Apple HIG 的字号阶梯 / 发丝分隔线 / 圆角卡片 / 大留白，
 * 配色换成更年轻、更通透、让食材照片更"跳"的方向。
 * 键名与旧版完全一致，所有页面零改动即同步换肤。
 */
export const D = {
  // ===== 背景 =====
  bg: '#F6F8F5',
  bgElevated: '#FFFFFF',
  bgGrouped: '#EFF2ED',
  bgGlass: 'rgba(255, 255, 255, 0.88)',
  bgGlassHeavy: 'rgba(255, 255, 255, 0.92)',

  // ===== 分隔线（中性、微冷）=====
  separator: 'rgba(17, 24, 17, 0.07)',
  separatorLight: 'rgba(17, 24, 17, 0.045)',

  // ===== 文字（近黑、中性）=====
  label: '#10130F',
  labelSecondary: 'rgba(16, 19, 15, 0.56)',
  labelTertiary: 'rgba(16, 19, 15, 0.34)',

  // ===== 强调色（鲜绿主色）=====
  accent: '#1AA251',
  accentMuted: 'rgba(26, 162, 81, 0.12)',
  accentLine: 'rgba(26, 162, 81, 0.20)',
  // 番茄橙：临期高亮 / 食欲点缀
  accentWarm: '#FF6B3D',
  accentWarmMuted: 'rgba(255, 107, 61, 0.13)',

  // ===== 语义色（iOS 风格、更鲜亮）=====
  blue: '#0A84FF',
  green: '#1AA251',
  red: '#F5412C',
  orange: '#FF6B3D',
  purple: '#7C5CFF',

  // ===== 标签色 =====
  tagMutedFg: '#8A8F8A',
  tagMutedBg: '#EFF2EC',

  // ===== 错误 =====
  errorBg: '#FFF1EE',
  errorAccent: '#FF6B4A',
  errorFg: '#E5392A',

  // ===== 圆角 =====
  radiusS: 12,
  radiusM: 16,
  radiusL: 20,
  radiusXL: 28,

  // ===== 阴影（更干净、更轻、微冷）=====
  shadowCard: '0 1px 8px rgba(18, 28, 18, 0.04), 0 1px 3px rgba(18, 28, 18, 0.03)',
  shadowLift: '0 12px 36px rgba(18, 28, 18, 0.07), 0 4px 14px rgba(18, 28, 18, 0.05)',

  // ===== 间距 =====
  pagePadH: 24,
  pagePadTop: 16,

  // ===== 烹饪模式（更冷的深色）=====
  cookingBg: '#15171A',
  cookingSurface: '#222528',
  cookingText: '#F5F8F5',
  cookingMuted: 'rgba(245, 248, 245, 0.55)',

  // ===== 字号 — Apple HIG =====
  titleLarge: 36,      // LargeTitle
  title: 28,           // Title 1 / Title 2
  headline: 20,       // Headline
  body: 17,            // Body
  callout: 16,        // Callout
  subheadline: 15,    // Subhead
  footnote: 13,        // Footnote
  caption: 11,         // Caption 1
  caption2: 10,        // Caption 2

  // ===== 字重 =====
  weightRegular: '400',
  weightMedium: '500',
  weightSemibold: '600',
  weightBold: '700',
  weightHeavy: '800',
} as const
