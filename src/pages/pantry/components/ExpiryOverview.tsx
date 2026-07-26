import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { D } from '../../../theme/designTokens'
import { setPickAutoSelectIngredients } from '../../../utils/navigationPayload'

export type HighlightMode = 'all' | 'expiring' | 'expired'

type Props = {
  pad: number
  totalCount: number
  expiringCount: number
  expiredCount: number
  expiringNames: string[]
  highlight: HighlightMode
  onHighlightChange: (mode: HighlightMode) => void
}

export function ExpiryOverview({
  pad,
  totalCount,
  expiringCount,
  expiredCount,
  expiringNames,
  highlight,
  onHighlightChange,
}: Props) {
  if (totalCount === 0) return null

  return (
    <>
      <View style={{ margin: `0 ${pad}px 14px`, display: 'flex', gap: 10 }}>
        <View
          style={{
            flex: 1,
            padding: '12px 14px',
            backgroundColor: D.bgElevated,
            borderRadius: D.radiusM,
            border: `0.5px solid ${D.separatorLight}`,
          }}
        >
          <Text
            style={{
              fontSize: D.caption,
              color: D.labelTertiary,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
            }}
          >
            共
          </Text>
          <Text
            style={{
              fontSize: D.title,
              fontWeight: D.weightBold,
              color: D.label,
              marginTop: 2,
              letterSpacing: '-0.02em',
            }}
          >
            {totalCount}
            <Text style={{ fontSize: D.caption, color: D.labelTertiary, fontWeight: D.weightRegular }}>
              {' '}
              项
            </Text>
          </Text>
        </View>
        {expiringCount > 0 ? (
          <View
            className="tap-scale"
            onClick={() => onHighlightChange('expiring')}
            style={{
              flex: 1,
              padding: '12px 14px',
              backgroundColor: D.accentWarmMuted,
              borderRadius: D.radiusM,
              border: `0.5px solid ${D.accentLine}`,
            }}
          >
            <Text
              style={{
                fontSize: D.caption,
                color: D.accentWarm,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
              }}
            >
              临期
            </Text>
            <Text
              style={{
                fontSize: D.title,
                fontWeight: D.weightBold,
                color: D.accentWarm,
                marginTop: 2,
              }}
            >
              {expiringCount}
            </Text>
            <View
              className="tap-scale"
              onClick={(e) => {
                e.stopPropagation()
                setPickAutoSelectIngredients(expiringNames)
                Taro.switchTab({ url: '/pages/pick/index' })
              }}
              style={{
                marginTop: 8,
                backgroundColor: D.accentWarm,
                borderRadius: 99,
                padding: '4px 10px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 10, color: D.onAccent, fontWeight: D.weightSemibold }}>去选菜</Text>
            </View>
          </View>
        ) : null}
        {expiredCount > 0 ? (
          <View
            className="tap-scale"
            onClick={() => onHighlightChange('expired')}
            style={{
              flex: 1,
              padding: '12px 14px',
              backgroundColor: D.errorBg,
              borderRadius: D.radiusM,
              border: `0.5px solid rgba(208,90,56,0.2)`,
            }}
          >
            <Text
              style={{
                fontSize: D.caption,
                color: D.red,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
              }}
            >
              过期
            </Text>
            <Text
              style={{
                fontSize: D.title,
                fontWeight: D.weightBold,
                color: D.red,
                marginTop: 2,
              }}
            >
              {expiredCount}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 8,
          padding: `0 ${pad}px`,
          marginBottom: 16,
        }}
      >
        {(
          [
            { k: 'all' as HighlightMode, t: '全貌' },
            { k: 'expiring' as HighlightMode, t: '只看临期' },
            { k: 'expired' as HighlightMode, t: '只看过期' },
          ] as const
        ).map(({ k, t }) => (
          <View
            key={k}
            className="tap-scale"
            style={{
              padding: '7px 14px',
              borderRadius: 999,
              backgroundColor: highlight === k ? D.label : D.bgElevated,
              border: highlight === k ? 'none' : `0.5px solid ${D.separator}`,
            }}
            onClick={() => onHighlightChange(k)}
          >
            <Text
              style={{
                fontSize: D.footnote,
                fontWeight: D.weightSemibold,
                color: highlight === k ? D.bgElevated : D.labelSecondary,
              }}
            >
              {t}
            </Text>
          </View>
        ))}
      </View>
    </>
  )
}
