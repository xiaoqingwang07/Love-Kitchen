import { View, Text, Button } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { D } from '../../../theme/designTokens'
import { getExpiryLabel } from '../../../types/pantry'
import type { PantryItem } from '../../../types/pantry'

export type DeductMatch = { ingredient: string; item: PantryItem }

type Props = {
  visible: boolean
  matches: DeductMatch[]
  /** 用户确认后回传要移除的冰箱条目 id（未勾选的保留） */
  onConfirm: (ids: string[]) => void
  onClose: () => void
}

/**
 * 做完饭的扣减确认：逐项勾选「用完了」才移除，取消勾选表示还剩一些、留在冰箱。
 * 替代旧的「一键整项删除」，避免半棵白菜做一顿就整棵消失。
 */
export function DeductConfirmSheet({ visible, matches, onConfirm, onClose }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!visible) return
    const next: Record<string, boolean> = {}
    matches.forEach((m) => {
      next[m.item.id] = true
    })
    setChecked(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  if (!visible) return null

  const selectedIds = matches.filter((m) => checked[m.item.id]).map((m) => m.item.id)

  return (
    <View
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(18,17,15,0.55)',
        zIndex: 400,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <View
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: D.bgElevated,
          borderTopLeftRadius: D.radiusXL,
          borderTopRightRadius: D.radiusXL,
          padding: `16px ${D.pagePadH}px`,
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
          maxHeight: '70vh',
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
            margin: '0 auto 16px',
          }}
        />
        <Text
          style={{
            fontSize: D.headline,
            fontWeight: D.weightBold,
            color: D.label,
            letterSpacing: '-0.02em',
          }}
        >
          这顿用掉了哪些？
        </Text>
        <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 4, marginBottom: 12 }}>
          勾选「用完了」的会从冰箱移除；只用了一部分就取消勾选，留在冰箱里
        </Text>

        <View
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            margin: '0 -4px',
            padding: '0 4px',
          }}
        >
          {matches.map(({ item }) => {
            const on = !!checked[item.id]
            return (
              <View
                key={item.id}
                className="tap-scale"
                onClick={() => setChecked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 10px',
                  borderRadius: D.radiusM,
                  backgroundColor: on ? D.accentMuted : 'transparent',
                  marginBottom: 4,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    border: on ? `2px solid ${D.accent}` : `1.5px solid ${D.separator}`,
                    backgroundColor: on ? D.accent : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {on ? (
                    <View
                      style={{
                        width: 8,
                        height: 5,
                        borderLeft: '2px solid #fff',
                        borderBottom: '2px solid #fff',
                        transform: 'rotate(-45deg)',
                        marginTop: -2,
                      }}
                    />
                  ) : null}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: D.body, fontWeight: D.weightMedium, color: D.label }}>
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 2 }}>
                    {item.amount} · {getExpiryLabel(item)}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: D.caption,
                    color: on ? D.accent : D.labelTertiary,
                    fontWeight: on ? D.weightSemibold : D.weightRegular,
                    flexShrink: 0,
                  }}
                >
                  {on ? '用完了' : '还剩一些'}
                </Text>
              </View>
            )
          })}
        </View>

        <View style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <Button
            style={{
              flex: 1,
              height: 48,
              borderRadius: 999,
              backgroundColor: D.bgGrouped,
              color: D.label,
              fontSize: D.subheadline,
              fontWeight: D.weightSemibold,
              border: `0.5px solid ${D.separator}`,
            }}
            onClick={onClose}
          >
            全部保留
          </Button>
          <Button
            style={{
              flex: 1.6,
              height: 48,
              borderRadius: 999,
              backgroundColor: D.accent,
              color: '#fff',
              fontSize: D.subheadline,
              fontWeight: D.weightSemibold,
              border: 'none',
            }}
            onClick={() => onConfirm(selectedIds)}
          >
            {selectedIds.length > 0 ? `从冰箱扣掉 ${selectedIds.length} 项` : '不用扣'}
          </Button>
        </View>
      </View>
    </View>
  )
}
