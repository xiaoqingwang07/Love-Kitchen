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

/**
 * 原有大标题「我的」+ 副标题「爱心厨房 · 你的家庭饭桌助理」已移除：
 * 页面名在原生导航栏，副标题是纯装饰，两者都与下方内容重复。
 */
export function ProfileStatsHeader({ stats, achievements, onStatClick }: Props) {
  return (
    <View style={{ padding: '16px 22px 20px' }}>
      {/* 三张大卡片收敛为一行可点小字：这里是次要信息，不该占掉三分之一屏 */}
      <View style={{ display: 'flex', flexDirection: 'row', gap: 20, paddingLeft: 2 }}>
        {stats.map((s) => (
          <Text
            key={s.action}
            className="tap-scale"
            style={{ fontSize: D.footnote, color: D.labelSecondary }}
            onClick={() => onStatClick(s.action)}
          >
            {s.label}{' '}
            <Text style={{ color: D.label, fontWeight: D.weightSemibold }}>{s.value}</Text>
          </Text>
        ))}
      </View>

      <AchievementsPanel achievements={achievements} />
    </View>
  )
}
