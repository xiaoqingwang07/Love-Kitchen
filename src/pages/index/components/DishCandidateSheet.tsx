import { View, Text } from '@tarojs/components'
import type { DishCandidate } from '../../../api/dishVision'
import { D } from '../../../theme/designTokens'

type Props = {
  candidates: DishCandidate[]
  onPick: (name: string) => void
  onClose: () => void
}

export function DishCandidateSheet({ candidates, onPick, onClose }: Props) {
  return (
    <View
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <View
        style={{
          backgroundColor: D.bgElevated,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: '20px 16px calc(20px + env(safe-area-inset-bottom))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Text style={{ fontSize: D.headline, fontWeight: D.weightBold, color: D.label }}>
          这道菜是哪个？
        </Text>
        <Text style={{ fontSize: D.footnote, color: D.labelTertiary, marginTop: 4 }}>
          相似的菜照片上不好分，点一下确认，给你对应做法
        </Text>

        {candidates.map((c, i) => (
          <View
            key={c.name}
            className="tap-scale"
            onClick={() => onPick(c.name)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 12,
              padding: 14,
              borderRadius: D.radiusM,
              backgroundColor: i === 0 ? D.accentMuted : D.bgGrouped,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: D.body, fontWeight: D.weightSemibold, color: D.label }}>
                {c.name}
                {i === 0 ? (
                  <Text style={{ fontSize: D.caption, color: D.accent }}>　最像</Text>
                ) : null}
              </Text>
              {c.note ? (
                <Text style={{ fontSize: D.caption, color: D.labelSecondary, marginTop: 3 }}>
                  {c.note}
                </Text>
              ) : null}
            </View>
            <Text style={{ fontSize: D.body, color: D.labelTertiary }}>›</Text>
          </View>
        ))}

        <View
          className="tap-scale"
          onClick={onClose}
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: D.radiusM,
            backgroundColor: 'transparent',
          }}
        >
          <Text style={{ fontSize: D.footnote, color: D.labelTertiary, textAlign: 'center' }}>
            都不是 · 关闭
          </Text>
        </View>
      </View>
    </View>
  )
}
