import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import { AchievementsPanel } from './AchievementsPanel'
import type { Achievement } from '../../../utils/achievements'

type StatItem = {
  label: string
  value: number
  action: 'pantry' | 'favorites' | 'cooked'
}

type Props = {
  stats: StatItem[]
  achievements: Achievement[]
  onStatClick: (action: StatItem['action']) => void
}

export function ProfileStatsHeader({ stats, achievements, onStatClick }: Props) {
  return (
    <View style={{ padding: '44px 22px 20px' }}>
      <Text
        style={{
          fontSize: D.titleLarge,
          fontWeight: D.weightBold,
          color: D.label,
          letterSpacing: '-0.04em',
        }}
      >
        我的
      </Text>
      <Text style={{ fontSize: D.footnote, color: D.labelSecondary, marginTop: 8 }}>
        爱心厨房 · 你的家庭饭桌助理
      </Text>

      <View style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        {stats.map((s) => (
          <View
            key={s.action}
            className="tap-scale"
            style={{
              flex: 1,
              backgroundColor: D.bgElevated,
              borderRadius: D.radiusM,
              padding: '14px 12px',
              border: `0.5px solid ${D.separatorLight}`,
              boxShadow: D.shadowCard,
            }}
            onClick={() => onStatClick(s.action)}
          >
            <Text
              style={{
                fontSize: D.title,
                fontWeight: D.weightBold,
                color: D.label,
                letterSpacing: '-0.02em',
              }}
            >
              {s.value}
            </Text>
            <Text style={{ fontSize: D.caption, color: D.labelSecondary, marginTop: 4 }}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      <AchievementsPanel achievements={achievements} />
    </View>
  )
}
