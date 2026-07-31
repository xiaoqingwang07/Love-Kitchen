import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { D } from '../theme/designTokens'
import type { ShoppingItem } from '../utils/shoppingList'
import { formatShoppingListText } from '../utils/shoppingList'
import { primeShoppingShare } from '../utils/shareLinks'
import { householdApiConfigured } from '../api/household'

type Props = {
  visible: boolean
  items: ShoppingItem[]
  onClose: () => void
  /** 将勾选的缺失项加入本地采购清单 */
  onAddToList?: (items: { name: string; amount: string }[]) => void
}

/**
 * 采购清单底部 Sheet：默认把「缺少」项勾上，允许用户改动后复制 / 分享
 */
export function ShoppingListSheet({ visible, items, onClose, onAddToList }: Props) {
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

  const prepareShare = () => {
    const picked = items
      .filter((i) => checked[i.name])
      .map((i) => ({ name: i.name, amount: i.amount || '适量' }))
    if (picked.length === 0) {
      Taro.showToast({ title: '请先勾选要分享的', icon: 'none' })
      return
    }
    primeShoppingShare({ title: '爱心厨房采购', items: picked })
  }

  const addToList = () => {
    const missing = items
      .filter((i) => checked[i.name] && !i.haveIt)
      .map((i) => ({ name: i.name, amount: i.amount }))
    if (missing.length === 0) {
      Taro.showToast({ title: '请先勾选要买的', icon: 'none' })
      return
    }
    onAddToList?.(missing)
    Taro.showToast({ title: '已加入采购清单', icon: 'success' })
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

        {/* 操作区：一个主按钮通栏，次要动作退为一行文字链。
            原先四个按钮并排挤在一行，「加入采购清单」被压到换行，
            深色主按钮旁边还有个橙色按钮抢重点，主次全乱。 */}
        <View style={{ marginTop: 18 }}>
          <View
            className="tap-scale"
            style={{
              height: 48,
              borderRadius: D.radiusS,
              backgroundColor: D.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={onAddToList ? addToList : copy}
          >
            <Text style={{ fontSize: D.body, fontWeight: D.weightSemibold, color: D.onAccent }}>
              {onAddToList
                ? `加入采购清单${selectedCount ? ` · ${selectedCount} 项` : ''}`
                : `复制清单${selectedCount ? ` · ${selectedCount} 项` : ''}`}
            </Text>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 28,
              marginTop: 14,
            }}
          >
            {onAddToList ? (
              <Text
                className="tap-scale"
                style={{ fontSize: D.footnote, color: D.labelSecondary, padding: '6px 4px' }}
                onClick={copy}
              >
                复制清单
              </Text>
            ) : null}
            <Button
              openType="share"
              onClick={prepareShare}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '6px 4px',
                lineHeight: 'normal',
                fontSize: D.footnote,
                color: D.labelSecondary,
              }}
            >
              分享
            </Button>
            <Text
              className="tap-scale"
              style={{ fontSize: D.footnote, color: D.labelSecondary, padding: '6px 4px' }}
              onClick={onClose}
            >
              关闭
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
