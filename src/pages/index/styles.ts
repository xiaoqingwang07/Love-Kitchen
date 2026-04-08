/**
 * 首页 — 双核：搜索 + 今日推荐；留白与层级克制
 */
import type { CSSProperties } from 'react'
import { D } from '../../theme/designTokens'

export const pageStyle: CSSProperties = {
  minHeight: '100vh',
  backgroundColor: D.bg,
  paddingBottom: '88px',
  paddingTop: D.pagePadTop,
}

export const headerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  paddingLeft: D.pagePadH,
  paddingRight: D.pagePadH,
  paddingTop: 28,
  paddingBottom: 4,
  alignItems: 'flex-start',
  maxWidth: '100%',
}

export const headerRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  paddingLeft: D.pagePadH,
  paddingRight: D.pagePadH,
  paddingTop: 44,
  paddingBottom: 4,
}

export const headerLinkStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: '600',
  color: D.accent,
  paddingTop: 6,
  flexShrink: 0,
}

export const titleStyle: CSSProperties = {
  fontSize: 34,
  fontWeight: '700',
  color: D.label,
  letterSpacing: '-0.04em',
  lineHeight: 1.15,
}

export const titleHintStyle: CSSProperties = {
  marginTop: 10,
  fontSize: D.footnote,
  color: D.labelTertiary,
  fontWeight: '400',
  letterSpacing: '0.02em',
  lineHeight: 1.45,
  maxWidth: '100%',
}

export const searchSectionStyle: CSSProperties = {
  padding: `20px ${D.pagePadH} 10px`,
}

export const searchRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  gap: 0,
}

export const searchBarWrapStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
}

export const searchBarStyle: CSSProperties = {
  backgroundColor: D.bgElevated,
  borderRadius: D.radiusL,
  display: 'flex',
  alignItems: 'center',
  padding: '12px 12px 12px 16px',
  border: `0.5px solid ${D.separatorLight}`,
  boxShadow: D.shadowCard,
  height: '100%',
}

export const searchSubmitStyle: CSSProperties = {
  flexShrink: 0,
  padding: '10px 16px',
  borderRadius: 999,
  backgroundColor: D.accent,
  marginLeft: 8,
}

export const searchSubmitTextStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: '600',
  color: '#fff',
}

export const searchIconStyle: CSSProperties = {
  fontSize: 17,
  marginRight: 12,
  opacity: 0.4,
  color: D.labelSecondary,
}

export const sceneRowStyle: CSSProperties = {
  paddingLeft: D.pagePadH,
  paddingRight: D.pagePadH,
  paddingBottom: 4,
  paddingTop: 2,
}

export const sceneScrollStyle: CSSProperties = {
  whiteSpace: 'nowrap' as const,
}

export const sceneChipStyle = (active: boolean): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 14px',
  borderRadius: 999,
  marginRight: 8,
  fontSize: 13,
  fontWeight: active ? '600' : '500',
  border: active ? 'none' : `0.5px solid ${D.separator}`,
  backgroundColor: active ? D.accent : D.bgElevated,
  color: active ? '#fff' : D.labelSecondary,
})

export const historyBoxStyle: CSSProperties = {
  backgroundColor: D.bgElevated,
  borderRadius: D.radiusM,
  margin: `0 ${D.pagePadH} 16px`,
  padding: '16px 16px 12px',
  border: `0.5px solid ${D.separatorLight}`,
}

export const historyHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
}

export const historyTitleStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: '600',
  color: D.labelTertiary,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
}

export const clearBtnStyle: CSSProperties = {
  fontSize: D.footnote,
  color: D.blue,
  fontWeight: '500',
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

export const recipesSectionStyle: CSSProperties = {
  padding: `8px ${D.pagePadH} 24px`,
}

export const sectionHeaderBlockStyle: CSSProperties = {
  marginBottom: 16,
}

export const sectionTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: '600',
  color: D.labelSecondary,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  marginBottom: 8,
}

export const sectionLeadStyle: CSSProperties = {
  fontSize: D.body,
  fontWeight: '600',
  color: D.label,
  lineHeight: 1.45,
  letterSpacing: '-0.02em',
}

export const sectionMetaRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  rowGap: 8,
  marginTop: 6,
}

export const sectionMetaTextStyle: CSSProperties = {
  fontSize: D.footnote,
  color: D.labelTertiary,
  flex: 1,
  minWidth: '60%',
  lineHeight: 1.4,
}

export const sectionMoreStyle: CSSProperties = {
  fontSize: D.footnote,
  color: D.accent,
  fontWeight: '600',
  flexShrink: 0,
}

export const recipeListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

export const moreStripTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: '600',
  color: D.labelSecondary,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  marginTop: 20,
  marginBottom: 10,
}

export const moreStripScrollStyle: CSSProperties = {
  whiteSpace: 'nowrap' as const,
  marginBottom: 8,
}

export const moreChipStyle: CSSProperties = {
  display: 'inline-flex',
  flexDirection: 'column',
  width: 120,
  marginRight: 10,
  verticalAlign: 'top' as const,
  backgroundColor: D.bgElevated,
  borderRadius: D.radiusM,
  overflow: 'hidden',
  border: `0.5px solid ${D.separatorLight}`,
  boxShadow: D.shadowCard,
}

export const moreChipThumbStyle: CSSProperties = {
  width: '100%',
  height: 72,
  backgroundColor: D.bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export const moreChipTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: '600',
  color: D.label,
  padding: '8px 10px 10px',
  lineHeight: 1.35,
  whiteSpace: 'normal' as const,
}

export const recipeRowCardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  backgroundColor: D.bgElevated,
  borderRadius: D.radiusM,
  overflow: 'hidden',
  border: `0.5px solid ${D.separatorLight}`,
  boxShadow: D.shadowCard,
}

export const recipeThumbWrapStyle: CSSProperties = {
  width: 112,
  height: 112,
  flexShrink: 0,
  backgroundColor: D.bg,
}

export const recipeRowBodyStyle: CSSProperties = {
  flex: 1,
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minWidth: 0,
}

export const recipeTitleStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: '600',
  color: D.label,
  marginBottom: 6,
  display: 'block',
  lineHeight: 1.35,
  letterSpacing: '-0.02em',
}

export const recipeTagStyle: CSSProperties = {
  fontSize: D.caption,
  color: D.labelTertiary,
  fontWeight: '500',
}
