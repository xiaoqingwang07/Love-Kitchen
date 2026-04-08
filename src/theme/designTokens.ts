/**
 * 苹果风格暖白 + 焦糖强调：简洁、克制、大留白 — Apple HIG 审美融入食物温度
 */
export const D = {
  // ===== 背景 =====
  bg: '#FAF9F7',
  bgElevated: '#FFFFFF',
  bgGrouped: '#F5F5F7',
  bgGlass: 'rgba(255, 255, 255, 0.88)',
  bgGlassHeavy: 'rgba(255, 255, 255, 0.92)',

  // ===== 分隔线 =====
  separator: 'rgba(24, 22, 18, 0.06)',
  separatorLight: 'rgba(24, 22, 18, 0.04)',

  // ===== 文字 =====
  label: '#12110F',
  labelSecondary: 'rgba(18, 17, 15, 0.55)',
  labelTertiary: 'rgba(18, 17, 15, 0.35)',

  // ===== 强调色 =====
  accent: '#A67B5B',
  accentMuted: 'rgba(166, 123, 91, 0.12)',
  accentLine: 'rgba(166, 123, 91, 0.18)',
  accentWarm: '#C4944A',
  accentWarmMuted: 'rgba(196, 148, 74, 0.14)',

  // ===== 语义色 =====
  blue: '#5B8FA8',
  green: '#4A8C6C',
  red: '#D05A38',
  orange: '#C4944A',
  purple: '#8E7FC5',

  // ===== 标签色 =====
  tagMutedFg: '#8e8e93',
  tagMutedBg: '#F5F3F0',

  // ===== 错误 =====
  errorBg: '#FFF5F0',
  errorAccent: '#E8845A',
  errorFg: '#D05A38',

  // ===== 圆角 =====
  radiusS: 12,
  radiusM: 16,
  radiusL: 20,
  radiusXL: 28,

  // ===== 阴影 =====
  shadowCard: '0 1px 10px rgba(18, 17, 15, 0.04), 0 2px 8px rgba(18, 17, 15, 0.03)',
  shadowLift: '0 12px 40px rgba(18, 17, 15, 0.06), 0 4px 16px rgba(18, 17, 15, 0.04)',

  // ===== 间距 =====
  pagePadH: 24,
  pagePadTop: 16,

  // ===== 烹饪模式 =====
  cookingBg: '#1C1A17',
  cookingSurface: '#2A2724',
  cookingText: '#FAF9F7',
  cookingMuted: 'rgba(250, 249, 247, 0.55)',

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
