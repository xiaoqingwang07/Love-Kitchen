import { View, Button } from '@tarojs/components'
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
        padding: `12px ${D.pagePadH}px`,
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        backgroundColor: D.bgGlassHeavy,
        backdropFilter: 'blur(20px)',
        borderTop: `0.5px solid ${D.separatorLight}`,
        boxSizing: 'border-box',
        display: 'flex',
        gap: 10,
      }}
    >
      <Button
        style={{
          flex: 1,
          height: 52,
          borderRadius: 999,
          backgroundColor: D.bgElevated,
          color: D.label,
          border: `0.5px solid ${D.separator}`,
          fontSize: D.subheadline,
          fontWeight: D.weightSemibold,
        }}
        onClick={onMarkCooked}
      >
        做过啦
      </Button>
      <Button
        style={{
          flex: 1.6,
          height: 52,
          borderRadius: 999,
          backgroundColor: D.accent,
          color: '#fff',
          fontWeight: D.weightSemibold,
          fontSize: D.body,
          border: 'none',
        }}
        onClick={onStartCooking}
      >
        {hasSteps ? '开始做' : '暂无步骤'}
      </Button>
    </View>
  )
}
