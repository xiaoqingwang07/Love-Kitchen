import { View, Text, ScrollView } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import { FRIDGE_LAYOUT_PRESETS, type FridgeLayoutConfig } from '../../../types/fridge'
import type { FridgeSide } from '../../../types/fridge'

type Props = {
  visible: boolean
  pad: number
  layout: FridgeLayoutConfig
  onClose: () => void
  onApplyPreset: (presetIndex: number) => void
  onAdjustSlotCount: (side: FridgeSide, delta: number) => void
}

export function FridgeLayoutSettingsSheet({
  visible,
  pad,
  layout,
  onClose,
  onApplyPreset,
  onAdjustSlotCount,
}: Props) {
  if (!visible) return null

  return (
    <View
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(18,17,15,0.36)',
        zIndex: 190,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <View
        style={{
          width: '100%',
          backgroundColor: D.bgElevated,
          borderTopLeftRadius: D.radiusXL,
          borderTopRightRadius: D.radiusXL,
          padding: `18px ${pad}px`,
          paddingBottom: 'calc(22px + env(safe-area-inset-bottom))',
          boxShadow: D.shadowLift,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <View
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: D.separator,
            margin: '0 auto 16px',
          }}
        />
        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: D.headline, fontWeight: D.weightBold, color: D.label }}>冰箱设置</Text>
            <Text className="lk-block" style={{ display: 'block', marginTop: 4, fontSize: D.footnote, color: D.labelSecondary }}>
              低频设置，选定后一般无需再改
            </Text>
          </View>
          <View
            className="tap-scale"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: D.bgGrouped,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18, color: D.labelSecondary }}>×</Text>
          </View>
        </View>

        <Text style={{ display: 'block', marginTop: 16, marginBottom: 8, fontSize: D.caption, color: D.labelTertiary }}>
          类型
        </Text>
        <ScrollView scrollX showScrollbar={false} style={{ whiteSpace: 'nowrap' }}>
          <View style={{ display: 'flex', gap: 8 }}>
            {FRIDGE_LAYOUT_PRESETS.map((preset, idx) => {
              const active = preset.type === layout.type
              return (
                <View
                  key={preset.type}
                  className="tap-scale"
                  onClick={() => onApplyPreset(idx)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    backgroundColor: active ? D.label : D.bgGrouped,
                    border: active ? 'none' : `0.5px solid ${D.separatorLight}`,
                  }}
                >
                  <Text
                    style={{
                      fontSize: D.footnote,
                      fontWeight: D.weightSemibold,
                      color: active ? D.bgElevated : D.labelSecondary,
                    }}
                  >
                    {preset.name}
                  </Text>
                </View>
              )
            })}
          </View>
        </ScrollView>

        <View style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {(
            [
              { side: 'freezer' as FridgeSide, title: '冷冻格数', value: layout.freezerSlots, color: D.freezerAccent },
              { side: 'fridge' as FridgeSide, title: '冷藏格数', value: layout.fridgeSlots, color: D.chillAccent },
            ] as const
          ).map((item) => (
            <View
              key={item.side}
              style={{
                flex: 1,
                backgroundColor: D.bgGrouped,
                borderRadius: D.radiusL,
                padding: '11px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: `0.5px solid ${D.separatorLight}`,
              }}
            >
              <View>
                <Text style={{ fontSize: D.caption, color: D.labelTertiary }}>{item.title}</Text>
                <Text
                  style={{
                    display: 'block',
                    fontSize: D.title,
                    fontWeight: D.weightBold,
                    color: item.color,
                    marginTop: 2,
                  }}
                >
                  {item.value}
                </Text>
              </View>
              <View style={{ display: 'flex', gap: 6 }}>
                {[
                  { label: '−', delta: -1 },
                  { label: '+', delta: 1 },
                ].map((btn) => (
                  <View
                    key={btn.label}
                    className="tap-scale"
                    onClick={() => onAdjustSlotCount(item.side, btn.delta)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `0.5px solid ${D.separatorLight}`,
                      boxShadow: '0 1px 4px rgba(18,17,15,0.05)',
                    }}
                  >
                    <Text style={{ fontSize: 18, lineHeight: '28px', color: D.label }}>{btn.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
