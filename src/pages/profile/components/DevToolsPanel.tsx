import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import { D } from '../../../theme/designTokens'

type Props = {
  onCopyAnalytics: () => void
  onClearAnalytics: () => void
  onTestLlmProxy: () => void
  onResetMock: () => void
  onClearFridge: () => void
}

/**
 * 开发者选项：默认折叠。
 *
 * 原先五个按钮全部平铺，占掉「我的」页面一大截，而普通用户一辈子不会点。
 * 现在收成一行，点开才展开；展开后也不再用大按钮，改为轻量条目。
 */
export function DevToolsPanel({
  onCopyAnalytics,
  onClearAnalytics,
  onTestLlmProxy,
  onResetMock,
  onClearFridge,
}: Props) {
  const [open, setOpen] = useState(false)

  const rows: { t: string; onTap: () => void; danger?: boolean }[] = [
    { t: '复制埋点 JSON', onTap: onCopyAnalytics },
    { t: '清空埋点', onTap: onClearAnalytics },
    { t: '检测 AI 服务', onTap: onTestLlmProxy },
    { t: '重置冰箱数据', onTap: onResetMock, danger: true },
    { t: '清空冰箱（测空库）', onTap: onClearFridge, danger: true },
  ]

  return (
    <View style={{ marginTop: 24 }}>
      <View
        className="tap-scale"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          paddingBottom: 10,
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <Text style={{ fontSize: D.footnote, color: D.labelTertiary }}>开发者选项</Text>
        <Text style={{ fontSize: D.footnote, color: D.labelTertiary }}>{open ? '收起' : '展开'}</Text>
      </View>

      {open ? (
        <View
          style={{
            backgroundColor: D.bgElevated,
            borderRadius: D.radiusM,
            overflow: 'hidden',
          }}
        >
          {rows.map((r, i) => (
            <View
              key={r.t}
              className="tap-scale"
              style={{
                paddingLeft: 15,
                paddingRight: 15,
                height: 46,
                display: 'flex',
                alignItems: 'center',
                borderTop: i === 0 ? 'none' : `0.5px solid ${D.separator}`,
              }}
              onClick={r.onTap}
            >
              <Text style={{ fontSize: D.footnote, color: r.danger ? D.errorFg : D.label }}>
                {r.t}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}
