import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'
import { D } from '../theme/designTokens'

type OverlayProps = {
  zIndex?: number
  onClose: () => void
  children: ReactNode
}

/** 底部弹层遮罩。面板自己决定高度，不要用 flex:1 把短内容撑满屏幕。 */
export function SheetOverlay({ zIndex = 400, onClose, children }: OverlayProps) {
  return (
    <View
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(18,17,15,0.55)',
        zIndex,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      {children}
    </View>
  )
}

type PanelProps = {
  children: ReactNode
  maxHeight?: string
}

export function SheetPanel({ children, maxHeight = '78vh' }: PanelProps) {
  return (
    <View
      onClick={(e) => e.stopPropagation()}
      style={{
        backgroundColor: D.bgElevated,
        borderTopLeftRadius: D.radiusXL,
        borderTopRightRadius: D.radiusXL,
        padding: `8px ${D.pagePadH}px 0`,
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
        maxHeight,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: D.shadowLift,
      }}
    >
      <View
        style={{
          alignSelf: 'center',
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: D.separator,
          margin: '4px 0 14px',
        }}
      />
      {children}
    </View>
  )
}

export function SheetHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        className="lk-title"
        style={{
          fontSize: D.headline,
          fontWeight: D.weightSemibold,
          color: D.label,
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          className="lk-block"
          style={{
            fontSize: D.footnote,
            color: D.labelSecondary,
            marginTop: 6,
            lineHeight: 1.35,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  )
}

/** 可滚动区：只在内容超出时滚动，绝不 flex:1 撑出空白。 */
export function SheetBody({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        flexShrink: 1,
        minHeight: 0,
      }}
    >
      {children}
    </View>
  )
}

export function PrimaryButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <View
      className="tap-scale"
      onClick={disabled ? undefined : onClick}
      style={{
        flex: 1,
        height: 48,
        borderRadius: 999,
        backgroundColor: disabled ? D.bgGrouped : D.accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text
        style={{
          fontSize: 17,
          fontWeight: D.weightSemibold,
          color: disabled ? D.labelTertiary : D.onAccent,
          lineHeight: 1.2,
        }}
      >
        {label}
      </Text>
    </View>
  )
}

export function TextAction({
  label,
  onClick,
  tone = 'default',
}: {
  label: string
  onClick: () => void
  tone?: 'default' | 'danger'
}) {
  return (
    <View
      className="tap-scale"
      onClick={onClick}
      style={{
        height: 48,
        padding: '0 6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text
        style={{
          fontSize: 17,
          fontWeight: D.weightMedium,
          color: tone === 'danger' ? D.red : D.labelSecondary,
          lineHeight: 1.2,
        }}
      >
        {label}
      </Text>
    </View>
  )
}

/** 一主一次：文字操作 + 实心主按钮，禁止两颗等权胶囊并排。 */
export function SheetActions({
  secondary,
  primary,
}: {
  secondary: { label: string; onClick: () => void; tone?: 'default' | 'danger' }
  primary: { label: string; onClick: () => void; disabled?: boolean }
}) {
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginTop: 14,
      }}
    >
      <TextAction {...secondary} />
      <PrimaryButton {...primary} />
    </View>
  )
}

export function TwoLine({ title, detail }: { title: string; detail?: string }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Text
        className="lk-block"
        style={{
          fontSize: D.body,
          fontWeight: D.weightMedium,
          color: D.label,
          lineHeight: 1.25,
        }}
      >
        {title}
      </Text>
      {detail ? (
        <Text
          className="lk-block"
          style={{
            fontSize: D.caption,
            color: D.labelTertiary,
            marginTop: 3,
            lineHeight: 1.25,
          }}
        >
          {detail}
        </Text>
      ) : null}
    </View>
  )
}
