import { View, Text } from '@tarojs/components'
import type { DishCandidate } from '../../../api/dishVision'
import { D, mediaRowTextCol } from '../../../theme/designTokens'
import { SheetHeading, SheetOverlay, SheetPanel } from '../../../components/SheetChrome'

type Props = {
  candidates: DishCandidate[]
  onPick: (name: string) => void
  onClose: () => void
}

export function DishCandidateSheet({ candidates, onPick, onClose }: Props) {
  return (
    <SheetOverlay zIndex={1000} onClose={onClose}>
      <SheetPanel>
        <SheetHeading title="这道菜是哪个？" subtitle="相似的菜照片上不好分，点一下确认" />

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
            <View style={mediaRowTextCol}>
              <Text className="lk-block" style={{ fontSize: D.body, fontWeight: D.weightSemibold, color: D.label, lineHeight: 1.25 }}>
                {c.name}
                {i === 0 ? (
                  <Text style={{ fontSize: D.caption, color: D.accentDeep }}>  最像</Text>
                ) : null}
              </Text>
              {c.note ? (
                <Text className="lk-block" style={{ fontSize: D.caption, color: D.labelSecondary, marginTop: 3, lineHeight: 1.25 }}>
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
          <Text className="lk-block" style={{ fontSize: D.footnote, color: D.labelTertiary, textAlign: 'center', lineHeight: 1.2 }}>
            都不是 · 关闭
          </Text>
        </View>
      </SheetPanel>
    </SheetOverlay>
  )
}
