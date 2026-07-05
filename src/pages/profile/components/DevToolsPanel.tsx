import { View, Text, Button } from '@tarojs/components'
import { D } from '../../../theme/designTokens'

type Props = {
  onCopyAnalytics: () => void
  onClearAnalytics: () => void
  onTestLlmProxy: () => void
  onResetMock: () => void
  onClearFridge: () => void
}

export function DevToolsPanel({
  onCopyAnalytics,
  onClearAnalytics,
  onTestLlmProxy,
  onResetMock,
  onClearFridge,
}: Props) {
  return (
    <View
      style={{
        marginTop: 24,
        padding: '14px 16px',
        borderRadius: D.radiusM,
        border: `0.5px dashed ${D.separator}`,
      }}
    >
      <Text
        style={{
          fontSize: D.caption,
          color: D.labelTertiary,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          marginBottom: 10,
        }}
      >
        开发者选项
      </Text>
      <Button
        style={{
          height: 40,
          backgroundColor: D.bgGrouped,
          color: D.label,
          borderRadius: 999,
          fontSize: D.footnote,
          border: 'none',
          marginBottom: 10,
        }}
        onClick={onCopyAnalytics}
      >
        复制埋点 JSON
      </Button>
      <Button
        style={{
          height: 40,
          backgroundColor: D.bg,
          color: D.labelTertiary,
          borderRadius: 999,
          fontSize: D.footnote,
          border: `0.5px solid ${D.separator}`,
          marginBottom: 10,
        }}
        onClick={onClearAnalytics}
      >
        清空埋点
      </Button>
      <Button
        style={{
          height: 40,
          backgroundColor: D.bg,
          color: D.label,
          borderRadius: 999,
          fontSize: D.footnote,
          border: `0.5px solid ${D.separator}`,
          marginBottom: 10,
        }}
        onClick={onTestLlmProxy}
      >
        检测 AI 服务
      </Button>
      <Button
        style={{
          height: 40,
          backgroundColor: D.errorBg,
          color: D.errorFg,
          borderRadius: 999,
          fontSize: D.footnote,
          border: 'none',
        }}
        onClick={onResetMock}
      >
        重置冰箱数据
      </Button>
      <Button
        style={{
          height: 40,
          backgroundColor: D.bgGrouped,
          color: D.label,
          borderRadius: 999,
          fontSize: D.footnote,
          border: 'none',
          marginTop: 10,
        }}
        onClick={onClearFridge}
      >
        清空冰箱（测空库）
      </Button>
    </View>
  )
}
