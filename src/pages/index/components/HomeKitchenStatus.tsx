import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { D } from '../../../theme/designTokens'
import { AppIcon } from '../../../components/AppIcon'
import { trackEvent } from '../../../utils/analytics'
import { usePantryStore, useHouseholdStore } from '../../../store/context'
import { getFreshnessStatus } from '../../../types/pantry'
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
    <View
      style={{
        margin: `12px ${D.pagePadH}px 0`,
        padding: 16,
        borderRadius: D.radiusL,
        backgroundColor: D.bgElevated,
        border: `0.5px solid ${D.separatorLight}`,
      }}
    >
      <Text style={{ fontSize: D.caption, fontWeight: D.weightSemibold, color: D.labelSecondary, letterSpacing: '0.08em' }}>
        厨房状态
      </Text>
      <View style={{ display: 'flex', flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 26, fontWeight: D.weightBold, color: D.label }}>{pantryCount}</Text>
          <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 2 }}>冰箱食材</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 26, fontWeight: D.weightBold, color: expiringCount > 0 ? D.accentWarm : D.label }}>
            {expiringCount}
          </Text>
          <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 2 }}>快过期</Text>
        </View>
        <View
          style={{ flex: 1, alignItems: 'center' }}
          className="tap-scale"
          onClick={() => {
            if (shoppingCount > 0) {
              Taro.switchTab({ url: '/pages/profile/index' })
            }
          }}
        >
          <Text style={{ fontSize: 26, fontWeight: D.weightBold, color: D.label }}>{shoppingCount}</Text>
          <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 2 }}>待采购</Text>
        </View>
      </View>
      <View
        className="tap-scale"
        style={{
          marginTop: 14,
          height: 46,
          borderRadius: 999,
          backgroundColor: D.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
        onClick={() => {
          trackEvent('home_kitchen_cta', { pantryCount, expiringCount })
          onTonightMeal()
        }}
      >
        <AppIcon name="meal" size={18} color="#fff" backgroundColor="rgba(255,255,255,0.2)" />
        <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: '#fff' }}>今晚吃什么</Text>
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
