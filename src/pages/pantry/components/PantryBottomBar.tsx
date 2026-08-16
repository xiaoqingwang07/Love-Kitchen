import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { D } from '../../../theme/designTokens'

type Props = {
  pad: number
  onReceiptIntake: () => void
  onIngredientsIntake: () => void
  onPasteIntake: () => void
}

const INTAKE_METHODS = ['拍小票', '拍食材照片', '粘贴文字清单'] as const

/**
 * 冰箱页底部操作条：只保留一个主按钮。
 *
 * 原先并排 5 个按钮，占满两行、遮挡柜体，其中三个本质都是「往冰箱里加东西」。
 * 现在收敛为单个「添加食材」，点开再选录入方式；
 * 过期清理移到过期卡片上（就近操作），去搭配页由底部 tab 承担。
 */
export function PantryBottomBar({ pad, onReceiptIntake, onIngredientsIntake, onPasteIntake }: Props) {
  const openIntakePicker = () => {
    void Taro.showActionSheet({
      itemList: [...INTAKE_METHODS],
      success: ({ tapIndex }) => {
        if (tapIndex === 0) onReceiptIntake()
        else if (tapIndex === 1) onIngredientsIntake()
        else if (tapIndex === 2) onPasteIntake()
      },
      fail: () => {
        /* 用户取消，无需处理 */
      },
    })
  }

  return (
    <View
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        padding: `8px ${pad}px`,
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
        backgroundColor: D.bgGlassHeavy,
        backdropFilter: 'blur(20px)',
        borderTop: `0.5px solid ${D.separatorLight}`,
        boxSizing: 'border-box',
      }}
    >
      <View
        className="tap-scale"
        style={{
          height: 40,
          borderRadius: D.radiusS,
          backgroundColor: D.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={openIntakePicker}
      >
        <Text style={{ fontSize: D.body, fontWeight: D.weightSemibold, color: D.onAccent }}>
          添加食材
        </Text>
      </View>
    </View>
  )
}
