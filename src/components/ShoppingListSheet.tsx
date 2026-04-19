import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { D } from '../theme/designTokens'
import type { ShoppingItem } from '../utils/shoppingList'
import { formatShoppingListText } from '../utils/shoppingList'

type Props = {
  visible: boolean
  items: ShoppingItem[]
  onClose: () => void
}

/**
 * 采购清单底部 Sheet：默认把「缺少」项勾上，允许用户改动后复制 / 分享
 */
export function ShoppingListSheet({ visible, items, onClose }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!visible) return
    const next: Record<string, boolean> = {}
    items.forEach((i) => {
      next[i.name] = !i.haveIt
    })
    setChecked(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  if (!visible) return null

  const selected = items.filter((i) => checked[i.name])
  const selectedCount = selected.length

  const copy = () => {
    const text = formatShoppingListText(
      items.map((i) => ({ ...i, haveIt: !checked[i.name] }))
    )
    Taro.setClipboardData({ data: text }).then(() => {
      Taro.showToast({ title: '已复制', icon: 'success' })
    })
  }

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
          maxHeight: '82vh',
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
        <View
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: D.headline,
              fontWeight: D.weightBold,
              color: D.label,
              letterSpacing: '-0.02em',
            }}
          >
            采购清单
          </Text>
          <Text style={{ fontSize: D.caption, color: D.labelTertiary }}>
            勾选要买的；已取消勾的视为已有
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            margin: '0 -4px',
            padding: '0 4px',
          }}
        >
          {items.map((item) => {
            const on = !!checked[item.name]
            return (
              <View
                key={item.name}
                className="tap-scale"
                onClick={() =>
                  setChecked((prev) => ({ ...prev, [item.name]: !prev[item.name] }))
                }
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
                    <Text style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</Text>
                  ) : null}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: D.body,
                      fontWeight: D.weightMedium,
                      color: D.label,
                      textDecoration: !on && !item.haveIt ? 'none' : 'none',
                    }}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: D.caption,
                      color: D.labelTertiary,
                      marginTop: 2,
                    }}
                  >
                    {item.amount}
                    {item.haveIt ? ' · 冰箱里有' : ''}
                  </Text>
                </View>
              </View>
            )
          })}
          {items.length === 0 ? (
            <Text
              style={{
                fontSize: D.footnote,
                color: D.labelTertiary,
                textAlign: 'center',
                padding: '24px 0',
              }}
            >
              这道菜没有记录用料
            </Text>
          ) : null}
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
            关闭
          </Button>
          <Button
            style={{
              flex: 1.4,
              height: 48,
              borderRadius: 999,
              backgroundColor: D.accent,
              color: '#fff',
              fontSize: D.subheadline,
              fontWeight: D.weightSemibold,
              border: 'none',
            }}
            onClick={copy}
          >
            复制 {selectedCount ? `(${selectedCount})` : ''}
          </Button>
          <Button
            openType="share"
            style={{
              flex: 1,
              height: 48,
              borderRadius: 999,
              backgroundColor: D.accentMuted,
              color: D.accent,
              fontSize: D.subheadline,
              fontWeight: D.weightSemibold,
              border: 'none',
            }}
          >
            分享
          </Button>
        </View>
      </View>
    </View>
  )
}
