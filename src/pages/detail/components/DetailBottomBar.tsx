import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'

type Props = {
  hasSteps: boolean
  onMarkCooked: () => void
  onStartCooking: () => void
}

export function DetailBottomBar({ hasSteps, onMarkCooked, onStartCooking }: Props) {
  return (
    <View
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        padding: `10px ${D.pagePadH}px`,
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
        backgroundColor: D.bgGlassHeavy,
        backdropFilter: 'blur(20px)',
        borderTop: `0.5px solid ${D.separatorLight}`,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <View
        className="tap-scale"
        style={{
          height: 48,
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        onClick={onMarkCooked}
      >
        <Text style={{ fontSize: 17, fontWeight: D.weightMedium, color: D.labelSecondary, lineHeight: 1.2 }}>
          做过啦
        </Text>
      </View>
      <View
        className="tap-scale"
        style={{
          flex: 1,
          height: 48,
          borderRadius: 999,
          backgroundColor: hasSteps ? D.accent : D.bgGrouped,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onStartCooking}
      >
        <Text
          style={{
            fontSize: 17,
            fontWeight: D.weightSemibold,
            color: hasSteps ? D.onAccent : D.labelTertiary,
            lineHeight: 1.2,
          }}
        >
          {hasSteps ? '开始做' : '暂无步骤'}
        </Text>
      </View>
    </View>
  )
}
