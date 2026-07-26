import { View, Text, Input } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import { AppIcon } from '../../../components/AppIcon'
import { getFreshnessStatus } from '../../../types/pantry'
import type { PantryItem } from '../../../types/pantry'
import type { FridgeSide } from '../../../types/fridge'
import { describeExisting } from '../../../utils/duplicateGuard'

/** 清洗逛超市查询词（语音 / 手输） */
export function cleanSupermarketLookupQuery(raw: string): string {
  let s = raw.trim().replace(/[？?！!。，,、；;：:\s]+/g, '')
  const isQuestion = /[？?]$/.test(raw.trim()) || /有没有|有没有|有吗|还有吗/.test(raw)
  const prefixes = ['有没有', '有吗', '还有', '家里有没有', '冰箱有没有', '查一下', '看看有没有']
  for (const p of prefixes) {
    if (s.startsWith(p)) {
      s = s.slice(p.length)
      break
    }
  }
  if (isQuestion && s.startsWith('有') && !s.startsWith('有机') && s.length > 1) {
    s = s.slice(1)
  }
  return s.trim()
}

type Props = {
  pad: number
  lookupQuery: string
  lookupResults: PantryItem[] | null
  onLookupQueryChange: (value: string) => void
  onSelectItem: (side: FridgeSide, slotIndex: number) => void
  onVoiceClick: () => void
}

export function SupermarketLookup({
  pad,
  lookupQuery,
  lookupResults,
  onLookupQueryChange,
  onSelectItem,
  onVoiceClick,
}: Props) {
  const lookupName = cleanSupermarketLookupQuery(lookupQuery)

  return (
    <View
      style={{
        margin: `0 ${pad}px 14px`,
        padding: 14,
        backgroundColor: D.bgElevated,
        borderRadius: D.radiusL,
        border: `0.5px solid ${D.separatorLight}`,
        boxShadow: D.shadowCard,
      }}
    >
      <View style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 40,
            padding: '0 12px',
            borderRadius: 999,
            backgroundColor: D.bgGrouped,
          }}
        >
          <AppIcon name="search" size={14} color={D.labelTertiary} backgroundColor="transparent" />
          <Input
            value={lookupQuery}
            placeholder="逛超市先查冰箱：想买什么？"
            placeholderStyle={`color:${D.labelTertiary}`}
            confirmType="search"
            onInput={(e) => onLookupQueryChange(e.detail.value)}
            style={{ flex: 1, fontSize: D.callout, color: D.label, height: 40 }}
          />
          {lookupQuery ? (
            <Text
              className="tap-scale"
              onClick={() => onLookupQueryChange('')}
              style={{ fontSize: 15, color: D.labelTertiary, padding: '0 2px' }}
            >
              ✕
            </Text>
          ) : null}
        </View>
        <View
          className="tap-scale"
          onClick={onVoiceClick}
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            backgroundColor: D.accentMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AppIcon name="mic" size={16} color={D.accent} />
        </View>
      </View>

      {!lookupName ? (
        <Text className="lk-block" style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 10, lineHeight: 1.5 }}>
          拿不准家里还有没有？输入或说一句「有没有西红柿」，立刻知道在哪、放了多久。
        </Text>
      ) : lookupResults && lookupResults.length > 0 ? (
        (() => {
          const hasOld = lookupResults.some((it) => getFreshnessStatus(it) !== 'fresh')
          return (
            <View
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: D.radiusM,
                backgroundColor: hasOld ? D.accentWarmMuted : D.accentMuted,
              }}
            >
              <Text
                style={{
                  fontSize: D.subheadline,
                  fontWeight: D.weightBold,
                  color: hasOld ? D.orange : D.accent,
                }}
              >
                {hasOld ? `家里有「${lookupName}」了，先别买` : `家里有「${lookupName}」`}
              </Text>
              {lookupResults.map((it) => (
                <View
                  key={it.id}
                  className="tap-scale"
                  onClick={() => onSelectItem(it.side, it.slotIndex)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <Text style={{ fontSize: D.footnote, color: D.label, fontWeight: D.weightMedium }}>
                    {it.name}（{it.amount}）
                  </Text>
                  <Text style={{ fontSize: D.caption, color: D.labelSecondary, flexShrink: 0 }}>
                    {describeExisting(it)} ›
                  </Text>
                </View>
              ))}
              {hasOld ? (
                <Text className="lk-block" style={{ fontSize: D.caption, color: D.orange, marginTop: 8, lineHeight: 1.4 }}>
                  有临期 / 过期的，回家先吃旧的，别再囤。
                </Text>
              ) : null}
            </View>
          )
        })()
      ) : (
        <View
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: D.radiusM,
            backgroundColor: D.bgGrouped,
          }}
        >
          <View style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppIcon name="cart" size={16} color={D.label} />
            <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.label }}>
              家里没有「{lookupName}」，可以买
            </Text>
          </View>
          <Text className="lk-block" style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 4, lineHeight: 1.4 }}>
            没查到同类库存（叫法不同也可能查不到，可换个常用名再试）。
          </Text>
        </View>
      )}
    </View>
  )
}
