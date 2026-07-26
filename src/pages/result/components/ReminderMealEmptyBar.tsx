import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { usePantryStore, useHouseholdStore } from '../../../store/context'
import { trackEvent } from '../../../utils/analytics'
import { D } from '../../../theme/designTokens'

type Props = {
  expiringNames: string[]
}

function ActionBtn({
  label,
  accent,
  onClick,
}: {
  label: string
  accent?: boolean
  onClick: () => void
}) {
  return (
    <View
      className="tap-scale"
      style={{
        flex: 1,
        height: 40,
        borderRadius: 999,
        backgroundColor: accent ? D.accentMuted : D.bgElevated,
        border: accent ? 'none' : `0.5px solid ${D.separatorLight}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClick}
    >
      <Text
        style={{
          fontSize: D.caption,
          color: accent ? D.accent : D.labelSecondary,
          fontWeight: accent ? D.weightSemibold : D.weightRegular,
        }}
      >
        {label}
      </Text>
    </View>
  )
}

export const ReminderMealEmptyBar = observer(function ReminderMealEmptyBar({ expiringNames }: Props) {
  const pantryStore = usePantryStore()
  const householdStore = useHouseholdStore()
  const label = expiringNames.length > 0 ? expiringNames.join('、') : '临期食材'

  const handleExtend = () => {
    const count = pantryStore.extendExpiringByNames(expiringNames, 3)
    trackEvent('reminder_empty_action', { action: 'extend', count })
    Taro.showToast({
      title: count > 0 ? `已延长 ${count} 项 3 天` : '冰箱里没有对应食材',
      icon: count > 0 ? 'success' : 'none',
    })
  }

  const handleDiscard = () => {
    Taro.showModal({
      title: '标记已用完？',
      content: `将从冰箱移除：${label}`,
      confirmText: '确认移除',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) return
        const count = pantryStore.deductItems(expiringNames)
        trackEvent('reminder_empty_action', { action: 'discard', count })
        Taro.showToast({
          title: count > 0 ? `已移除 ${count} 项` : '未找到对应食材',
          icon: count > 0 ? 'success' : 'none',
        })
      },
    })
  }

  const handleAddShopping = () => {
    const items = expiringNames.map((name) => ({ name, amount: '适量' }))
    if (items.length === 0) {
      Taro.showToast({ title: '暂无临期清单', icon: 'none' })
      return
    }
    householdStore.addShoppingItems(items)
    trackEvent('reminder_empty_action', { action: 'shopping_list', count: items.length })
    Taro.showToast({
      title: '已加入采购清单',
      icon: 'success',
      duration: 2000,
    })
    setTimeout(() => {
      Taro.showModal({
        title: '去查看采购清单？',
        content: '可在「我的」页查看、勾选和删除待买项。',
        confirmText: '去我的',
        cancelText: '稍后',
        success: (res) => {
          if (res.confirm) Taro.switchTab({ url: '/pages/profile/index' })
        },
      })
    }, 500)
  }

  const handleGoPantry = () => {
    trackEvent('reminder_empty_action', { action: 'go_pantry' })
    Taro.switchTab({ url: '/pages/pantry/index' })
  }

  return (
    <View
      style={{
        marginBottom: 16,
        padding: 14,
        borderRadius: D.radiusL,
        backgroundColor: D.bgElevated,
        border: `0.5px solid ${D.separatorLight}`,
      }}
    >
      <Text className="lk-block"
        style={{
          fontSize: D.footnote,
          color: D.labelSecondary,
          lineHeight: 1.5,
          display: 'block',
          marginBottom: 10,
        }}
      >
        暂时拼不出完整方案，你可以延长保存、标记已用完，或列入采购后再做。
      </Text>
      <View style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <ActionBtn label="延长 3 天" accent onClick={handleExtend} />
        <ActionBtn label="标记已用完" onClick={handleDiscard} />
      </View>
      <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
        <ActionBtn label="加入采购" accent onClick={handleAddShopping} />
        <ActionBtn label="去冰箱处理" onClick={handleGoPantry} />
      </View>
    </View>
  )
})
