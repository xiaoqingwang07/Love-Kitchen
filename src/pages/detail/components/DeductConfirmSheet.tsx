import { View, Text } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { D } from '../../../theme/designTokens'
import { getExpiryLabel } from '../../../types/pantry'
import type { PantryItem } from '../../../types/pantry'
import {
  SheetActions,
  SheetBody,
  SheetHeading,
  SheetOverlay,
  SheetPanel,
  TwoLine,
} from '../../../components/SheetChrome'

export type DeductMatch = { ingredient: string; item: PantryItem }

type Props = {
  visible: boolean
  matches: DeductMatch[]
  onConfirm: (ids: string[]) => void
  onClose: () => void
}

export function DeductConfirmSheet({ visible, matches, onConfirm, onClose }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!visible) return
    const next: Record<string, boolean> = {}
    matches.forEach((m) => {
      next[m.item.id] = true
    })
    setChecked(next)
  }, [visible, matches])

  if (!visible) return null

  const selectedIds = matches.filter((m) => checked[m.item.id]).map((m) => m.item.id)

  return (
    <SheetOverlay onClose={onClose}>
      <SheetPanel>
        <SheetHeading
          title="这顿用掉了哪些？"
          subtitle="勾选「用完了」的会从冰箱移除；只用了一部分就取消勾选"
        />
        <SheetBody>
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
                  padding: '10px 8px',
                  borderRadius: D.radiusS,
                  backgroundColor: on ? D.accentMuted : 'transparent',
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
                <TwoLine title={item.name} detail={`${item.amount} · ${getExpiryLabel(item)}`} />
                <Text
                  style={{
                    fontSize: D.caption,
                    color: on ? D.accentDeep : D.labelTertiary,
                    fontWeight: on ? D.weightSemibold : D.weightRegular,
                    flexShrink: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {on ? '用完了' : '还剩一些'}
                </Text>
              </View>
            )
          })}
        </SheetBody>
        <SheetActions
          secondary={{ label: '全部保留', onClick: onClose }}
          primary={{
            label: selectedIds.length > 0 ? `从冰箱扣掉 ${selectedIds.length} 项` : '不用扣',
            onClick: () => onConfirm(selectedIds),
          }}
        />
      </SheetPanel>
    </SheetOverlay>
  )
}
