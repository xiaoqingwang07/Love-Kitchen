import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { D } from '../../../theme/designTokens'
import { trackEvent } from '../../../utils/analytics'
import { usePantryStore, useHouseholdStore } from '../../../store/context'
import { getFreshnessStatus } from '../../../types/pantry'
import { setProfileOpenShopping } from '../../../utils/navigationPayload'
import type { PantryItem } from '../../../types/pantry'

/** 跳转今晚方案页，携带冰箱食材与临期列表 */
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

/** 厨房状态面板：首屏展示「家里有什么、快过期什么、缺什么」 */
export function HomeKitchenStatus({ expiringCount, onTonightMeal }: Props) {
  const pantryStore = usePantryStore()
  const householdStore = useHouseholdStore()

  const pantryCount = pantryStore.totalCount
  const shoppingCount = householdStore.shoppingList.filter((i) => !i.checked).length

  if (pantryCount === 0) return null

  return (
    <View style={{ margin: `22px ${D.pagePadH}px 0` }}>
      {/* 全页唯一实心按钮：主操作独占重量，不与其他元素抢 */}
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
        onClick={() => {
          trackEvent('home_kitchen_cta', { pantryCount, expiringCount })
          onTonightMeal()
        }}
      >
        <Text
          style={{
            fontSize: D.body,
            fontWeight: D.weightSemibold,
            color: '#fff',
            letterSpacing: '0.02em',
          }}
        >
          今晚吃什么
        </Text>
      </View>

      {/* 背景信息降级为一行小字：临期已在顶部提醒条呈现，此处不重复 */}
      <View style={{ display: 'flex', flexDirection: 'row', gap: 20, marginTop: 18, paddingLeft: 4 }}>
        <Text style={{ fontSize: D.footnote, color: D.labelSecondary }}>
          冰箱 <Text style={{ color: D.label, fontWeight: D.weightSemibold }}>{pantryCount} 样</Text>
        </Text>
        <Text
          className="tap-scale"
          style={{ fontSize: D.footnote, color: D.labelSecondary }}
          onClick={() => {
            trackEvent('home_shopping_entry', { shoppingCount })
            setProfileOpenShopping()
            Taro.switchTab({ url: '/pages/profile/index' })
          }}
        >
          待采购 <Text style={{ color: D.label, fontWeight: D.weightSemibold }}>{shoppingCount}</Text>
        </Text>
      </View>
    </View>
  )
}

/** 加载示例冰箱并跳转今晚方案 */
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
