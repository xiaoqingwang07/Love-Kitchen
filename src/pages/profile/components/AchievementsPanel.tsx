import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import type { Achievement } from '../../../utils/achievements'

type Props = {
  achievements: Achievement[]
}

export function AchievementsPanel({ achievements }: Props) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <View
      style={{
        marginTop: 16,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Text style={{ fontSize: D.caption, color: D.labelTertiary, flexShrink: 0 }}>
        成就 {unlockedCount}/{achievements.length}
      </Text>
      <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {achievements.map((a) => (
          <Text
            key={a.id}
            style={{ fontSize: 16, opacity: a.unlocked ? 1 : 0.28, lineHeight: 1 }}
          >
            {a.emoji}
          </Text>
        ))}
      </View>
    </View>
  )
}
