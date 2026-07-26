import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'

export const QUICK_FILL_ITEMS = [
  '鸡蛋', '牛奶', '西红柿', '黄瓜', '土豆', '胡萝卜',
  '青椒', '猪肉', '鸡胸肉', '豆腐', '生菜', '大葱',
]

type Props = {
  pad: number
  selected: string[]
  onToggle: (name: string) => void
  onCommit: () => void
}

export function QuickFillPanel({ pad, selected, onToggle, onCommit }: Props) {
  return (
    <View
      style={{
        margin: `0 ${pad}px 14px`,
        padding: 16,
        backgroundColor: D.bgElevated,
        borderRadius: D.radiusM,
        border: `0.5px solid ${D.separatorLight}`,
      }}
    >
      <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.label }}>
        30 秒建好你的冰箱
      </Text>
      <Text className="lk-block" style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 4, lineHeight: 1.5 }}>
        点几样常买的，先把冰箱填起来 · 也可拍照 / 小票批量导入
      </Text>
      <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {QUICK_FILL_ITEMS.map((name) => {
          const on = selected.includes(name)
          return (
            <View
              key={name}
              className="tap-scale"
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                backgroundColor: on ? D.accent : D.bg,
                border: on ? 'none' : `0.5px solid ${D.separator}`,
              }}
              onClick={() => onToggle(name)}
            >
              <Text
                style={{
                  fontSize: D.footnote,
                  fontWeight: D.weightSemibold,
                  color: on ? '#fff' : D.labelSecondary,
                }}
              >
                {name}
              </Text>
            </View>
          )
        })}
      </View>
      {selected.length > 0 ? (
        <View
          className="tap-scale"
          style={{
            marginTop: 14,
            padding: '11px 0',
            borderRadius: D.radiusM,
            backgroundColor: D.label,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={onCommit}
        >
          <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.bgElevated }}>
            加入冰箱（{selected.length}）
          </Text>
        </View>
      ) : null}
    </View>
  )
}
