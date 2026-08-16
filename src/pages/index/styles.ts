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
  paddingTop: 10,
}

// 首页头部（大标题 / 日期 / 收藏入口）已全部移除，相关样式随之删除

// ================= 统一搜索框（Google 式） =================

/** 首页各区块统一的纵向节奏，避免每块各留各的边距导致疏密不匀 */
const BLOCK_GAP = 14

export const searchSectionStyle: CSSProperties = {
  padding: `${BLOCK_GAP}px ${D.pagePadH}px 0`,
}

/** 搜索壳：左边输入，右边动作栏。圆角随卡片统一为 18，不再单独用 28 */
export const searchShellStyle: CSSProperties = {
  backgroundColor: D.bgElevated,
  borderRadius: D.radiusM,
  border: `0.5px solid ${D.separatorLight}`,
  boxShadow: D.shadowCard,
  padding: '6px 6px 6px 16px',
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
  borderRadius: D.radiusS,
  backgroundColor: D.accent,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: 4,
}

export const searchSubmitTextStyle: CSSProperties = {
  fontSize: D.subheadline,
  fontWeight: D.weightSemibold,
  color: D.onAccent,
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
  margin: `0 ${D.pagePadH}px`,
  padding: '12px 16px',
  borderRadius: D.radiusL,
  background: `linear-gradient(135deg, ${D.accentWarmMuted} 0%, ${D.accentMuted} 100%)`,
  border: `0.5px solid ${D.accentLine}`,
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
  marginTop: 4,
}

/** 提醒条内只留一个动作：「去冰箱看看」与底部冰箱 tab 是同一目的地 */
export const urgentPrimaryBtnStyle: CSSProperties = {
  flex: 1,
  height: 42,
  borderRadius: D.radiusS,
  backgroundColor: D.accent,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export const onboardCardStyle: CSSProperties = {
  margin: `0 ${D.pagePadH}px`,
  padding: '16px 18px',
  borderRadius: D.radiusL,
  backgroundColor: D.bgElevated,
  border: `0.5px solid ${D.separatorLight}`,
  boxShadow: D.shadowCard,
}

// ================= 今日推荐 =================

export const recipesSectionStyle: CSSProperties = {
  padding: `0 ${D.pagePadH}px 24px`,
}

/** 推荐区头部：左边是标题，右边是轻动作 */
export const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginTop: 18,
  marginBottom: 10,
}

export const sectionTitleStyle: CSSProperties = {
  fontSize: D.headline,
  fontWeight: D.weightSemibold,
  color: D.label,
  letterSpacing: '-0.022em',
  lineHeight: 1.2,
}

export const sectionLeadStyle: CSSProperties = {
  fontSize: D.caption,
  color: D.labelTertiary,
  marginTop: 3,
  lineHeight: 1.3,
}

export const sectionActionsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  flexShrink: 0,
  marginRight: -10,
}

/** 撑出足够的手指命中区（裸文字在真机上点不中） */
export const sectionActionHitStyle: CSSProperties = {
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 6,
  paddingBottom: 6,
  display: 'flex',
  alignItems: 'center',
}

export const sectionActionStyle: CSSProperties = {
  fontSize: D.footnote,
  color: D.accentDeep,
  fontWeight: D.weightSemibold,
  flexShrink: 0,
}

/** 一组 inset 列表：一张面板、行间细线，避免四张白盒子并排 */
export const recommendListStyle: CSSProperties = {
  backgroundColor: D.bgElevated,
  borderRadius: D.radiusM,
  overflow: 'hidden',
}

export const recommendCardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 14,
  padding: '12px 14px',
}

export const recommendDividerStyle: CSSProperties = {
  height: 0.5,
  marginLeft: 116,
  backgroundColor: D.separatorLight,
}

export const recommendThumbStyle: CSSProperties = {
  width: 88,
  height: 88,
  flexShrink: 0,
  borderRadius: 12,
  backgroundColor: D.bgGrouped,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export const recommendTitleStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: D.weightSemibold,
  color: D.label,
  lineHeight: 1.25,
  letterSpacing: '-0.022em',
}

export const recommendMetaStyle: CSSProperties = {
  fontSize: D.footnote,
  color: D.labelTertiary,
  marginTop: 4,
  lineHeight: 1.3,
}

export const recommendStockRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: 8,
  marginTop: 6,
}

export const recommendStockHaveStyle: CSSProperties = {
  fontSize: D.caption,
  color: D.labelTertiary,
}

export const recommendStockMissStyle: CSSProperties = {
  fontSize: D.caption,
  color: D.accentDeep,
}

export const recommendStockReadyStyle: CSSProperties = {
  fontSize: D.caption,
  color: D.green,
}
