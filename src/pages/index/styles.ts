/**
 * 首页样式：统一搜索台面 + 今日推荐 + 临期卡片
 * 设计：暖白留白、克制层级、搜索框即产品门面
 */
import type { CSSProperties } from 'react'
import { D } from '../../theme/designTokens'

export const pageStyle: CSSProperties = {
  minHeight: '100vh',
  backgroundColor: D.bg,
  paddingBottom: 96,
  paddingTop: D.pagePadTop,
}

export const headerRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  paddingLeft: D.pagePadH,
  paddingRight: D.pagePadH,
  paddingTop: 40,
  paddingBottom: 4,
}

export const titleStyle: CSSProperties = {
  fontSize: D.titleLarge,
  fontWeight: D.weightBold,
  color: D.label,
  letterSpacing: '-0.04em',
  lineHeight: 1.12,
}

export const titleHintStyle: CSSProperties = {
  marginTop: 10,
  fontSize: D.footnote,
  color: D.labelTertiary,
  fontWeight: D.weightRegular,
  letterSpacing: '0.01em',
  lineHeight: 1.5,
}

export const headerLinkStyle: CSSProperties = {
  fontSize: D.subheadline,
  fontWeight: D.weightSemibold,
  color: D.accent,
  paddingTop: 6,
  flexShrink: 0,
}

// ================= 统一搜索框（Google 式） =================

export const searchSectionStyle: CSSProperties = {
  padding: `20px ${D.pagePadH}px 12px`,
}

/** 搜索壳：一体化大圆角，左边输入，右边动作栏 */
export const searchShellStyle: CSSProperties = {
  backgroundColor: D.bgElevated,
  borderRadius: 28,
  border: `0.5px solid ${D.separatorLight}`,
  boxShadow: D.shadowCard,
  padding: '6px 6px 6px 18px',
  display: 'flex',
  alignItems: 'center',
  gap: 0,
}

export const searchIconStyle: CSSProperties = {
  fontSize: 18,
  color: D.labelTertiary,
  marginRight: 10,
  flexShrink: 0,
}

export const searchInputStyle: CSSProperties = {
  flex: 1,
  fontSize: 16,
  color: D.label,
  height: 44,
  minWidth: 0,
}

/** 搜索壳右侧操作栏：分隔线 + 图标按钮 */
export const searchActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 0,
  paddingLeft: 4,
  borderLeft: `0.5px solid ${D.separator}`,
  marginLeft: 8,
}

export const searchActionBtnStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: D.labelSecondary,
  fontSize: 18,
}

/** 输入非空时出现的「搜索」主按钮 */
export const searchSubmitStyle: CSSProperties = {
  flexShrink: 0,
  paddingLeft: 14,
  paddingRight: 14,
  height: 40,
  borderRadius: 999,
  backgroundColor: D.accent,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: 4,
}

export const searchSubmitTextStyle: CSSProperties = {
  fontSize: D.subheadline,
  fontWeight: D.weightSemibold,
  color: '#fff',
  letterSpacing: '0.01em',
}

// ================= 历史搜索 =================

export const historyBoxStyle: CSSProperties = {
  backgroundColor: D.bgElevated,
  borderRadius: D.radiusL,
  margin: `0 ${D.pagePadH}px 16px`,
  padding: '16px 16px 12px',
  border: `0.5px solid ${D.separatorLight}`,
  boxShadow: D.shadowCard,
}

export const historyHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
}

export const historyTitleStyle: CSSProperties = {
  fontSize: D.caption,
  fontWeight: D.weightSemibold,
  color: D.labelTertiary,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
}

export const clearBtnStyle: CSSProperties = {
  fontSize: D.footnote,
  color: D.blue,
  fontWeight: D.weightMedium,
}

export const historyListStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

export const historyTagStyle: CSSProperties = {
  backgroundColor: D.bg,
  padding: '7px 12px',
  borderRadius: 999,
  fontSize: D.footnote,
  color: D.label,
  border: `0.5px solid ${D.separatorLight}`,
}

// ================= 快捷卡片（临期 / 空冰箱引导 / 今日推荐） =================

export const urgentCardStyle: CSSProperties = {
  margin: `4px ${D.pagePadH}px 18px`,
  padding: '16px 18px',
  borderRadius: D.radiusL,
  background: `linear-gradient(135deg, ${D.accentWarmMuted} 0%, ${D.accentMuted} 100%)`,
  border: `0.5px solid ${D.accentLine}`,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

export const urgentTitleStyle: CSSProperties = {
  fontSize: D.body,
  fontWeight: D.weightSemibold,
  color: D.label,
  letterSpacing: '-0.01em',
}

export const urgentLeadStyle: CSSProperties = {
  fontSize: D.footnote,
  color: D.labelSecondary,
  lineHeight: 1.5,
}

export const urgentActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  marginTop: 4,
}

export const urgentPrimaryBtnStyle: CSSProperties = {
  flex: 1,
  height: 40,
  borderRadius: 999,
  backgroundColor: D.accent,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export const urgentSecondaryBtnStyle: CSSProperties = {
  flex: 1,
  height: 40,
  borderRadius: 999,
  backgroundColor: D.bgElevated,
  border: `0.5px solid ${D.separatorLight}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export const onboardCardStyle: CSSProperties = {
  margin: `4px ${D.pagePadH}px 18px`,
  padding: '16px 18px',
  borderRadius: D.radiusL,
  backgroundColor: D.bgElevated,
  border: `0.5px solid ${D.separatorLight}`,
  boxShadow: D.shadowCard,
}

// ================= 今日推荐 =================

export const recipesSectionStyle: CSSProperties = {
  padding: `4px ${D.pagePadH}px 24px`,
}

export const sectionHeaderStyle: CSSProperties = {
  marginBottom: 14,
}

export const sectionTitleStyle: CSSProperties = {
  fontSize: D.caption,
  fontWeight: D.weightSemibold,
  color: D.labelSecondary,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  marginBottom: 6,
}

export const sectionLeadStyle: CSSProperties = {
  fontSize: D.body,
  fontWeight: D.weightSemibold,
  color: D.label,
  lineHeight: 1.4,
  letterSpacing: '-0.02em',
}

export const sectionMetaRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  rowGap: 8,
  marginTop: 10,
}

export const sectionMetaTextStyle: CSSProperties = {
  fontSize: D.caption,
  color: D.labelTertiary,
  flex: 1,
  minWidth: '60%',
  lineHeight: 1.4,
}

export const sectionActionsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 14,
  flexShrink: 0,
}

export const sectionActionStyle: CSSProperties = {
  fontSize: D.footnote,
  color: D.accent,
  fontWeight: D.weightSemibold,
  flexShrink: 0,
}

// 横向推荐条：大卡片 + 菜名覆盖
export const recommendScrollStyle: CSSProperties = {
  whiteSpace: 'nowrap' as const,
  marginBottom: 10,
  marginLeft: -4,
  paddingLeft: 4,
}

export const recommendCardStyle: CSSProperties = {
  display: 'inline-flex',
  flexDirection: 'column',
  width: 168,
  marginRight: 12,
  verticalAlign: 'top' as const,
  backgroundColor: D.bgElevated,
  borderRadius: D.radiusL,
  overflow: 'hidden',
  border: `0.5px solid ${D.separatorLight}`,
  boxShadow: D.shadowCard,
}

export const recommendThumbStyle: CSSProperties = {
  width: '100%',
  height: 112,
  backgroundColor: D.bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
}

export const recommendTitleStyle: CSSProperties = {
  fontSize: D.subheadline,
  fontWeight: D.weightSemibold,
  color: D.label,
  padding: '10px 12px 6px',
  lineHeight: 1.35,
  whiteSpace: 'normal' as const,
  letterSpacing: '-0.01em',
}

export const recommendMetaStyle: CSSProperties = {
  fontSize: D.caption,
  color: D.labelTertiary,
  padding: '0 12px 12px',
  whiteSpace: 'normal' as const,
}
