import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { D } from '../theme/designTokens'
import type { ShoppingItem } from '../utils/shoppingList'
import { formatShoppingListText } from '../utils/shoppingList'
import { isStapleIngredient } from '../utils/recipeIngredientFilter'
import { primeShoppingShare } from '../utils/shareLinks'
import {
  PrimaryButton,
  SheetBody,
  SheetHeading,
  SheetOverlay,
  SheetPanel,
  TwoLine,
} from './SheetChrome'

type Props = {
  visible: boolean
  items: ShoppingItem[]
  onClose: () => void
  onAddToList?: (items: { name: string; amount: string }[]) => void
}

export function ShoppingListSheet({ visible, items, onClose, onAddToList }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!visible) return
    const next: Record<string, boolean> = {}
    items.forEach((i) => {
      next[i.name] = !i.haveIt && !isStapleIngredient(i.name)
    })
    setChecked(next)
  }, [visible, items])

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
    Taro.showToast({ title: '已加入待买', icon: 'success' })
  }

  return (
    <SheetOverlay onClose={onClose}>
      <SheetPanel maxHeight="82vh">
        <SheetHeading title="待买清单" subtitle="勾选要买的；取消勾选视为已有" />
        <SheetBody>
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
                <TwoLine
                  title={item.name}
                  detail={`${item.amount}${item.haveIt ? ' · 冰箱里有' : ''}`}
                />
              </View>
            )
          })}
          {items.length === 0 ? (
            <Text
              className="lk-block"
              style={{
                fontSize: D.footnote,
                color: D.labelTertiary,
                textAlign: 'center',
                padding: '20px 0',
                lineHeight: 1.35,
              }}
            >
              这道菜没有记录用料
            </Text>
          ) : null}
        </SheetBody>

        <View style={{ marginTop: 14 }}>
          <PrimaryButton
            label={
              onAddToList
                ? `加入待买${selectedCount ? ` · ${selectedCount} 项` : ''}`
                : `复制清单${selectedCount ? ` · ${selectedCount} 项` : ''}`
            }
            onClick={onAddToList ? addToList : copy}
          />
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
              marginTop: 8,
            }}
          >
            {onAddToList ? (
              <Text
                className="tap-scale"
                style={{ fontSize: D.footnote, color: D.labelSecondary, padding: '10px 4px', lineHeight: 1.2 }}
                onClick={copy}
              >
                复制
              </Text>
            ) : null}
            <Button
              openType="share"
              onClick={prepareShare}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '10px 4px',
                margin: 0,
                lineHeight: 1.2,
                fontSize: D.footnote,
                color: D.labelSecondary,
                height: 40,
              }}
            >
              分享
            </Button>
            <Text
              className="tap-scale"
              style={{ fontSize: D.footnote, color: D.labelSecondary, padding: '10px 4px', lineHeight: 1.2 }}
              onClick={onClose}
            >
              关闭
            </Text>
          </View>
        </View>
      </SheetPanel>
    </SheetOverlay>
  )
}
