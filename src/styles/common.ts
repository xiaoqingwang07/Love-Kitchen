/**
 * 通用样式 - 跨页面复用
 */

// ============ 卡片样式 ============
export const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '18px',
  padding: '16px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
}

export const cardRowStyle: React.CSSProperties = {
  ...cardStyle,
  display: 'flex',
  alignItems: 'center',
  gap: '14px'
}

// ============ 图片盒子 ============
export const emojiBoxStyle: React.CSSProperties = {
  width: '72px',
  height: '72px',
  backgroundColor: '#fff7ed',
  borderRadius: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '36px',
  flexShrink: 0
}

export const emojiBoxSmallStyle: React.CSSProperties = {
  ...emojiBoxStyle,
  width: '64px',
  height: '64px',
  fontSize: '32px'
}

// ============ 文字样式 ============
export const titleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a2e',
  marginBottom: '4px'
}

export const titleLargeStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#1a1a2e',
  marginBottom: '4px'
}

export const subtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#8e8e93'
}

export const quoteStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#ff9a56',
  fontStyle: 'italic',
  marginBottom: '8px'
}

export const textMutedStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#aeaeb2'
}

// ============ 标签样式 ============
export const tagStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#8e8e93',
  backgroundColor: '#f3f4f6',
  padding: '2px 8px',
  borderRadius: '4px'
}

export const ratingBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
  backgroundColor: '#fffbeb',
  padding: '2px 8px',
  borderRadius: '6px'
}

// ============ 页面容器 ============
export const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#fafafa',
  padding: '20px',
  paddingBottom: '40px'
}

export const pageWithHeaderStyle: React.CSSProperties = {
  ...pageStyle,
  paddingTop: '0'
}

// ============ 空状态 ============
export const emptyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: '100px'
}

export const emptyEmojiStyle: React.CSSProperties = {
  fontSize: '64px',
  marginBottom: '20px'
}

export const emptyTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a2e',
  marginBottom: '8px'
}

export const emptyDescStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#aeaeb2',
  textAlign: 'center'
}

// ============ 加载状态 ============
export const loadingStyle: React.CSSProperties = {
  height: '60vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column'
}

export const loadingEmojiStyle: React.CSSProperties = {
  fontSize: '48px',
  marginBottom: '16px'
}

export const loadingTextStyle: React.CSSProperties = {
  color: '#8e8e93',
  fontSize: '15px',
  fontWeight: '500'
}

// ============ 错误提示 ============
export const errorBoxStyle: React.CSSProperties = {
  backgroundColor: '#fff7ed',
  borderRadius: '12px',
  padding: '14px 16px',
  marginBottom: '16px',
  borderLeft: '3px solid #ff9a56'
}

export const errorTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#ea580c'
}

// ============ 列表样式 ============
export const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px'
}

// ============ 信息行 ============
export const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap' as const
}

// ============ 头部 ============
export const headerStyle: React.CSSProperties = {
  marginBottom: '20px'
}

export const headerLargeStyle: React.CSSProperties = {
  marginBottom: '24px'
}
