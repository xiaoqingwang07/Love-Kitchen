import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import type { Achievement } from '../../../utils/achievements'

type Props = {
  achievements: Achievement[]
}

export function AchievementsPanel({ achievements }: Props) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <View style={{ marginTop: 28 }}>
      <View
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: D.caption,
            fontWeight: D.weightSemibold,
            color: D.labelSecondary,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
          }}
        >
          成就
        </Text>
        <Text style={{ fontSize: D.caption, color: D.labelTertiary }}>
          {unlockedCount}/{achievements.length}
        </Text>
      </View>
      <View style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {achievements.map((a) => (
          <View
            key={a.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: D.radiusM,
              backgroundColor: a.unlocked ? D.accentMuted : D.bgElevated,
              border: `0.5px solid ${a.unlocked ? D.accentLine : D.separatorLight}`,
              opacity: a.unlocked ? 1 : 0.55,
            }}
          >
            <Text style={{ fontSize: 22 }}>{a.emoji}</Text>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontSize: D.footnote,
                  fontWeight: D.weightSemibold,
                  color: a.unlocked ? D.label : D.labelSecondary,
                }}
              >
                {a.title}
              </Text>
              <Text
                style={{ fontSize: 10, color: D.labelTertiary, marginTop: 2, lineHeight: 1.3 }}
                numberOfLines={1}
              >
                {a.description}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
