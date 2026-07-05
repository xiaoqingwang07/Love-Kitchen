import type { CSSProperties } from 'react'
import { D } from '../../theme/designTokens'

export const resultPageStyles = {
  page: {
    minHeight: '100vh',
    backgroundColor: D.bg,
    padding: `${D.pagePadTop}px ${D.pagePadH}px 40px`,
  } as CSSProperties,
  header: { marginBottom: 20 } as CSSProperties,
  title: {
    fontSize: D.titleLarge,
    fontWeight: D.weightBold,
    color: D.label,
    marginBottom: 6,
    letterSpacing: '-0.04em',
  } as CSSProperties,
  subtitle: { fontSize: D.footnote, color: D.labelSecondary } as CSSProperties,
  regenBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    padding: '6px 12px',
    borderRadius: 999,
    backgroundColor: D.accentMuted,
    color: D.accent,
    fontSize: D.caption,
    fontWeight: D.weightSemibold,
  } as CSSProperties,
  listContainer: { display: 'flex', flexDirection: 'column', gap: 12 } as CSSProperties,
}

export function noticeBoxStyle(tone: 'info' | 'warn'): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: tone === 'warn' ? D.errorBg : D.accentMuted,
    borderRadius: D.radiusM,
    padding: '12px 14px',
    marginBottom: 16,
    borderLeft: `3px solid ${tone === 'warn' ? D.errorAccent : D.accent}`,
  }
}

export function noticeTitleStyle(tone: 'info' | 'warn'): CSSProperties {
  return {
    fontSize: D.footnote,
    fontWeight: D.weightSemibold,
    color: tone === 'warn' ? D.errorFg : D.accent,
    marginBottom: 2,
  }
}

export const noticeDetailStyle: CSSProperties = {
  fontSize: D.caption,
  color: D.labelSecondary,
  lineHeight: 1.5,
}
