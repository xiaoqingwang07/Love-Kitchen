import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useHouseholdStore } from '../../../store/context'
import { householdApiConfigured } from '../../../api/household'
import { AppIcon } from '../../../components/AppIcon'
import { ExpandChevron } from '../../../components/ExpandChevron'
import { D } from '../../../theme/designTokens'
import { primeShoppingShare } from '../../../utils/shareLinks'
import type { HouseholdShoppingItem } from '../../../types/household'

function ShoppingRow({
  item,
  onToggle,
}: {
  item: HouseholdShoppingItem
  onToggle: () => void
}) {
  return (
    <View
      key={item.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0',
        borderBottom: `0.5px solid ${D.separatorLight}`,
      }}
      onClick={onToggle}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          border: item.checked ? `2px solid ${D.accent}` : `1.5px solid ${D.separator}`,
          backgroundColor: item.checked ? D.accent : 'transparent',
          flexShrink: 0,
        }}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: D.body,
            color: item.checked ? D.labelTertiary : D.label,
            textDecoration: item.checked ? 'line-through' : 'none',
          }}
        >
          {item.name}
        </Text>
        <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 2 }}>
          {item.amount}
          {householdApiConfigured() && item.addedBy ? ` · ${item.addedBy}添加` : ''}
        </Text>
      </View>
    </View>
  )
}

function ShoppingListPanelInner() {
  const householdStore = useHouseholdStore()
  const [expanded, setExpanded] = useState(true)
  const pending = householdStore.shoppingList.filter((i) => !i.checked)
  const householdSyncOn = householdApiConfigured() && householdStore.inHousehold

  const cardStyle = {
    backgroundColor: D.bgElevated,
    borderRadius: D.radiusM,
    padding: 16,
    marginBottom: 10,
    border: `0.5px solid ${D.separatorLight}`,
  }

  const shareList = () => {
    const items = pending.map((i) => ({ name: i.name, amount: i.amount || '适量' }))
    if (items.length === 0) {
      Taro.showToast({ title: '没有待买项可分享', icon: 'none' })
      return
    }
    primeShoppingShare({ title: '爱心厨房采购', items })
  }

  return (
    <View style={cardStyle}>
      <View
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <View
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <AppIcon name="cart" size={16} color={D.accent} backgroundColor={D.accentMuted} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.label }}>
              采购清单
            </Text>
            <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 4 }}>
              {pending.length > 0
                ? `${pending.length} 样待买 · 勾选已买到的，可批量删除`
                : householdStore.shoppingList.length > 0
                ? '全部已勾选，可删除或继续添加'
                : '从菜谱或今晚方案加入缺失食材'}
            </Text>
          </View>
        </View>
        <ExpandChevron expanded={expanded} />
      </View>

      {expanded ? (
        <View style={{ marginTop: 14 }}>
          {householdSyncOn && householdStore.lastUpdatedLabel ? (
            <Text
              style={{
                fontSize: D.caption,
                color: D.labelSecondary,
                marginBottom: 10,
                display: 'block',
              }}
            >
              已与家庭同步 · {householdStore.lastUpdatedLabel}
            </Text>
          ) : null}

          {householdStore.shoppingList.length > 0 ? (
            <>
              {householdStore.shoppingList.map((item) => (
                <ShoppingRow
                  key={item.id}
                  item={item}
                  onToggle={() => householdStore.toggleShoppingItem(item.id)}
                />
              ))}
              <View style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Button
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 999,
                    backgroundColor: D.bg,
                    color: D.labelSecondary,
                    fontSize: D.caption,
                    border: `0.5px solid ${D.separator}`,
                  }}
                  onClick={() => householdStore.removeCheckedShopping()}
                >
                  删除已勾选
                </Button>
                <Button
                  openType="share"
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 999,
                    backgroundColor: D.accentMuted,
                    color: D.accent,
                    fontSize: D.caption,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={shareList}
                >
                  <View style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AppIcon
                      name="share"
                      size={14}
                      color={D.accent}
                      backgroundColor="transparent"
                      glyphOnly
                    />
                    <Text style={{ fontSize: D.caption, color: D.accent }}>分享清单</Text>
                  </View>
                </Button>
              </View>
            </>
          ) : (
            <Text
              style={{
                fontSize: D.footnote,
                color: D.labelTertiary,
                lineHeight: 1.6,
                padding: '8px 0 4px',
              }}
            >
              打开菜谱详情或「今晚方案」，把还缺的食材加入这里，买菜时勾选、删项即可。
            </Text>
          )}
        </View>
      ) : null}
    </View>
  )
}

export const ShoppingListPanel = observer(ShoppingListPanelInner)
