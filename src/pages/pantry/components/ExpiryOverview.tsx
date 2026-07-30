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
  /** 由底部操作条移来：清理动作就近放在过期卡上 */
  onClearExpired: () => void
  /** 由页面右上角移来：柜型切换并入筛选行 */
  presetName: string
  onOpenLayoutSettings: () => void
}

export function ExpiryOverview({
  pad,
  totalCount,
  expiringCount,
  expiredCount,
  expiringNames,
  highlight,
  onHighlightChange,
  onClearExpired,
  presetName,
  onOpenLayoutSettings,
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
              className="lk-block"
              style={{ fontSize: D.caption, color: D.accentWarm, letterSpacing: '0.12em' }}
            >
              临期
            </Text>
            <Text
              className="lk-block"
              style={{
                fontSize: D.title,
                fontWeight: D.weightBold,
                color: D.accentWarm,
                marginTop: 2,
                lineHeight: 1.1,
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
                marginTop: 10,
                alignSelf: 'flex-start',
                backgroundColor: D.accentWarm,
                borderRadius: D.radiusPill,
                paddingLeft: 11,
                paddingRight: 11,
                height: 26,
                display: 'flex',
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
              className="lk-block"
              style={{ fontSize: D.caption, color: D.red, letterSpacing: '0.12em' }}
            >
              过期
            </Text>
            <Text
              className="lk-block"
              style={{
                fontSize: D.title,
                fontWeight: D.weightBold,
                color: D.red,
                marginTop: 2,
                lineHeight: 1.1,
              }}
            >
              {expiredCount}
            </Text>
            {/* 由底部操作条移来：清理就近放在过期卡上，与临期卡的「去选菜」对称 */}
            <View
              className="tap-scale"
              onClick={(e) => {
                e.stopPropagation()
                onClearExpired()
              }}
              style={{
                marginTop: 8,
                alignSelf: 'flex-start',
                paddingLeft: 10,
                paddingRight: 10,
                height: 26,
                borderRadius: D.radiusPill,
                backgroundColor: D.bgElevated,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 10, color: D.errorFg, fontWeight: D.weightSemibold }}>清过期</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* 筛选行：右侧并入「柜型切换」——两者同属视图控件，
          原先柜型按钮单独挂在页面右上角，删掉大标题后会孤零零悬着 */}
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
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

        <View
          className="tap-scale"
          onClick={onOpenLayoutSettings}
          style={{
            marginLeft: 'auto',
            paddingLeft: 12,
            paddingRight: 12,
            height: 30,
            borderRadius: D.radiusPill,
            backgroundColor: D.bgElevated,
            border: `0.5px solid ${D.separator}`,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: D.footnote, color: D.labelSecondary }}>{presetName}</Text>
        </View>
      </View>
    </>
  )
}
