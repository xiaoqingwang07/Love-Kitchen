import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMemo } from 'react'
import { D } from '../../../theme/designTokens'
import { buildWeeklyMenuSuggestion } from '../../../utils/weeklyMenuSuggest'
import { trackEvent } from '../../../utils/analytics'
import type { PantryItem } from '../../../types/pantry'

type Props = {
  pantryItems: PantryItem[]
}

export function WeeklyMenuCard({ pantryItems }: Props) {
  const pantryNames = useMemo(() => pantryItems.map((i) => i.name), [pantryItems])
  const days = useMemo(() => buildWeeklyMenuSuggestion(pantryNames), [pantryNames])

  if (pantryNames.length === 0) return null

  return (
    <View
      style={{
        backgroundColor: D.bgElevated,
        borderRadius: D.radiusM,
        padding: 16,
        marginBottom: 10,
        border: `0.5px solid ${D.separatorLight}`,
      }}
    >
      <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.label }}>
        本周晚饭建议
      </Text>
      <Text className="lk-block" style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 4, marginBottom: 12 }}>
        按你冰箱里的食材，稳定推荐 5 个工作日
      </Text>
      {days.map((d) => (
        <View
          key={d.label}
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 10,
            paddingTop: 6,
            paddingBottom: 6,
            borderBottom: `0.5px solid ${D.separatorLight}`,
          }}
        >
          <Text style={{ fontSize: D.caption, color: D.accent, width: 36, flexShrink: 0 }}>
            {d.label}
          </Text>
          <Text style={{ fontSize: D.body, color: D.label, flex: 1 }} numberOfLines={1}>
            {d.title}
          </Text>
        </View>
      ))}
      <View
        className="tap-scale"
        style={{
          marginTop: 12,
          height: 40,
          borderRadius: 999,
          backgroundColor: D.accentMuted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => {
          trackEvent('weekly_menu_cta', { pantryCount: pantryNames.length })
          const ing = encodeURIComponent(pantryNames.join(','))
          Taro.navigateTo({ url: `/pages/result/index?from=meal&ingredients=${ing}&source=weekly` })
        }}
      >
        <Text style={{ fontSize: D.footnote, fontWeight: D.weightSemibold, color: D.accent }}>
          按本周建议做今晚
        </Text>
      </View>
    </View>
  )
}
