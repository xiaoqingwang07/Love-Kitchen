import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { D } from '../../../theme/designTokens'
import { trackEvent } from '../../../utils/analytics'
import { usePantryStore, useHouseholdStore } from '../../../store/context'
import { getFreshnessStatus } from '../../../types/pantry'
import { setPantryOpenShopping } from '../../../utils/navigationPayload'
import type { PantryItem } from '../../../types/pantry'

export function buildMealResultPath(items: PantryItem[], source: string): string {
  const names = items.map((i) => i.name)
  const expiring = items.filter((i) => getFreshnessStatus(i) === 'expiring').map((i) => i.name)
  const ing = encodeURIComponent(names.join(','))
  const exp = encodeURIComponent(expiring.join(','))
  const src = encodeURIComponent(source)
  return `/pages/result/index?from=meal&ingredients=${ing}&expiring=${exp}&source=${src}`
}

type Props = {
  expiringCount: number
  onTonightMeal: () => void
}

/** 一行：冰箱/采购状态 + 文字主操作，不再单独占一颗通栏按钮。 */
export function HomeKitchenStatus({ expiringCount, onTonightMeal }: Props) {
  const pantryStore = usePantryStore()
  const householdStore = useHouseholdStore()

  const pantryCount = pantryStore.totalCount
  const shoppingCount = householdStore.shoppingList.filter((i) => !i.checked).length

  if (pantryCount === 0) return null

  return (
    <View
      style={{
        margin: `6px ${D.pagePadH}px 0`,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Text style={{ fontSize: D.footnote, color: D.labelSecondary, lineHeight: 1.2 }}>
        冰箱 <Text style={{ color: D.label, fontWeight: D.weightSemibold }}>{pantryCount}</Text>
      </Text>
      <Text
        className="tap-scale"
        style={{ fontSize: D.footnote, color: D.labelSecondary, lineHeight: 1.2 }}
        onClick={() => {
          trackEvent('home_shopping_entry', { shoppingCount })
          setPantryOpenShopping()
          Taro.switchTab({ url: '/pages/pantry/index' })
        }}
      >
        待买 <Text style={{ color: D.label, fontWeight: D.weightSemibold }}>{shoppingCount}</Text>
      </Text>
      <View style={{ flex: 1 }} />
      <Text
        className="tap-scale"
        style={{
          fontSize: D.footnote,
          fontWeight: D.weightSemibold,
          color: D.accentDeep,
          lineHeight: 1.2,
          padding: '6px 0',
        }}
        onClick={() => {
          trackEvent('home_kitchen_cta', { pantryCount, expiringCount })
          onTonightMeal()
        }}
      >
        帮我搭配
      </Text>
    </View>
  )
}

export function loadDemoPantryAndGoMeal(pantryStore: {
  loadDemoPantry: () => PantryItem[]
}) {
  const items = pantryStore.loadDemoPantry()
  trackEvent('onboard_demo_pantry', { surface: 'home', count: items.length })
  Taro.showToast({ title: '已载入示例冰箱', icon: 'success' })
  const url = buildMealResultPath(items, 'demo-pantry')
  setTimeout(() => {
    Taro.navigateTo({ url })
  }, 400)
}
