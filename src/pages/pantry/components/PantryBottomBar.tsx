import { View, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { D } from '../../../theme/designTokens'
import { AppIcon } from '../../../components/AppIcon'

type Props = {
  pad: number
  expiredCount: number
  onReceiptIntake: () => void
  onIngredientsIntake: () => void
  onPasteIntake: () => void
  onClearExpired: () => void
}

export function PantryBottomBar({
  pad,
  expiredCount,
  onReceiptIntake,
  onIngredientsIntake,
  onPasteIntake,
  onClearExpired,
}: Props) {
  return (
    <View
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        padding: `12px ${pad}px`,
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        backgroundColor: D.bgGlassHeavy,
        backdropFilter: 'blur(20px)',
        borderTop: `0.5px solid ${D.separatorLight}`,
        boxSizing: 'border-box',
      }}
    >
      <View style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Button
          style={{
            flex: 1,
            height: 46,
            borderRadius: 999,
            backgroundColor: D.accent,
            color: D.onAccent,
            fontSize: D.footnote,
            fontWeight: D.weightSemibold,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
          onClick={onReceiptIntake}
        >
          <AppIcon name="camera" size={14} color="#fff" backgroundColor="rgba(255,255,255,0.2)" />
          拍小票
        </Button>
        <Button
          style={{
            flex: 1,
            height: 46,
            borderRadius: 999,
            backgroundColor: D.bgElevated,
            color: D.label,
            fontSize: D.footnote,
            fontWeight: D.weightSemibold,
            border: `0.5px solid ${D.separator}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
          onClick={onIngredientsIntake}
        >
          <AppIcon name="fridge" size={14} color={D.accent} />
          拍食材
        </Button>
      </View>
      <View style={{ display: 'flex', gap: 10 }}>
        <Button
          style={{
            flex: 1,
            height: 46,
            borderRadius: 999,
            backgroundColor: D.label,
            color: D.bgElevated,
            fontSize: D.footnote,
            fontWeight: D.weightSemibold,
            border: 'none',
          }}
          onClick={onPasteIntake}
        >
          粘贴清单
        </Button>
        {expiredCount > 0 ? (
          <Button
            style={{
              height: 50,
              borderRadius: 999,
              padding: '0 18px',
              backgroundColor: D.errorBg,
              color: D.errorFg,
              fontSize: D.footnote,
              fontWeight: D.weightSemibold,
              border: 'none',
            }}
            onClick={onClearExpired}
          >
            清过期
          </Button>
        ) : null}
        <Button
          style={{
            height: 50,
            borderRadius: 999,
            padding: '0 18px',
            backgroundColor: D.bgElevated,
            color: D.accentDeep,
            fontSize: D.footnote,
            fontWeight: D.weightSemibold,
            border: `0.5px solid ${D.separator}`,
          }}
          onClick={() => Taro.switchTab({ url: '/pages/pick/index' })}
        >
          去选菜
        </Button>
      </View>
    </View>
  )
}
