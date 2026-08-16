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
  /** 最紧急的临期项还剩几天（<=0 表示今天到期） */
  soonestExpiringDays: number | null
  /** 最久的过期项已过期几天 */
  longestExpiredDays: number | null
  highlight: HighlightMode
  onHighlightChange: (mode: HighlightMode) => void
  onClearExpired: () => void
  presetName: string
  onOpenLayoutSettings: () => void
  shoppingCount: number
  shoppingOpen: boolean
  onToggleShopping: () => void
}

function expiringText(days: number | null): string {
  if (days === null) return ''
  if (days <= 0) return '今天到期'
  if (days === 1) return '明天到期'
  return `最早还剩 ${days} 天`
}

function expiredText(days: number | null): string {
  if (days === null) return ''
  if (days <= 0) return '刚过期'
  return `最久已过期 ${days} 天`
}

/**
 * 冰箱概览：筛选行即计数行。
 *
 * 原先是三张大卡（共 N 项 / 临期 / 过期），每张里再塞一个操作按钮，
 * 占掉近三分之一屏且与下方筛选按钮语义重复。现在计数直接并进筛选按钮，
 * 选中某一类时才在下方显示该类的时间信息与对应操作——表面简洁，选中才展开。
 */
export function ExpiryOverview({
  pad,
  totalCount,
  expiringCount,
  expiredCount,
  expiringNames,
  soonestExpiringDays,
  longestExpiredDays,
  highlight,
  onHighlightChange,
  onClearExpired,
  presetName,
  onOpenLayoutSettings,
  shoppingCount,
  shoppingOpen,
  onToggleShopping,
}: Props) {
  const chips = [
    { k: 'all' as HighlightMode, t: '全部', n: totalCount, tone: D.label },
    { k: 'expiring' as HighlightMode, t: '临期', n: expiringCount, tone: D.accentWarm },
    { k: 'expired' as HighlightMode, t: '过期', n: expiredCount, tone: D.red },
  ].filter((c) => c.k === 'all' || c.n > 0)

  const detail =
    highlight === 'expiring' && expiringCount > 0
      ? {
          text: expiringText(soonestExpiringDays),
          action: '用它们做一顿',
          tone: D.accentWarm,
          onAct: () => {
            setPickAutoSelectIngredients(expiringNames)
            Taro.switchTab({ url: '/pages/pick/index' })
          },
        }
      : highlight === 'expired' && expiredCount > 0
        ? {
            text: expiredText(longestExpiredDays),
            action: '清理过期',
            tone: D.errorFg,
            onAct: onClearExpired,
          }
        : null

  return (
    <>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 6,
          padding: `0 ${pad}px`,
          marginBottom: detail ? 8 : 10,
        }}
      >
        {chips.map(({ k, t, n, tone }) => {
          const on = highlight === k
          return (
            <View
              key={k}
              className="tap-scale"
              style={{
                paddingLeft: 10,
                paddingRight: 10,
                height: 28,
                borderRadius: D.radiusPill,
                backgroundColor: on ? D.label : D.bgElevated,
                border: on ? 'none' : `0.5px solid ${D.separator}`,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
              onClick={() => onHighlightChange(k)}
            >
              <Text
                style={{
                  fontSize: D.footnote,
                  fontWeight: D.weightSemibold,
                  color: on ? D.bgElevated : D.labelSecondary,
                }}
              >
                {t}
              </Text>
              <Text
                style={{
                  fontSize: D.footnote,
                  fontWeight: D.weightSemibold,
                  color: on ? D.bgElevated : tone,
                }}
              >
                {n}
              </Text>
            </View>
          )
        })}

        <View
          className="tap-scale"
          onClick={onToggleShopping}
          style={{
            paddingLeft: 10,
            paddingRight: 10,
            height: 28,
            borderRadius: D.radiusPill,
            backgroundColor: shoppingOpen ? D.accent : D.bgElevated,
            border: shoppingOpen ? 'none' : `0.5px solid ${D.separator}`,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
            <Text
              style={{
                fontSize: D.footnote,
                fontWeight: D.weightSemibold,
                color: shoppingOpen ? D.onAccent : D.labelSecondary,
                lineHeight: 1.2,
              }}
            >
              待买
            </Text>
            <Text
              style={{
                fontSize: D.footnote,
                fontWeight: D.weightSemibold,
                color: shoppingOpen ? D.onAccent : D.accentDeep,
                lineHeight: 1.2,
              }}
            >
              {shoppingCount}
            </Text>
        </View>

        <View
          className="tap-scale"
          onClick={onOpenLayoutSettings}
          style={{
            marginLeft: 'auto',
            paddingLeft: 10,
            paddingRight: 10,
            height: 28,
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

      {/* 选中临期/过期时才出现：时间信息 + 对应操作 */}
      {detail ? (
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: `0 ${pad}px`,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: D.footnote, color: detail.tone }}>{detail.text}</Text>
          <Text
            className="tap-scale"
            style={{ fontSize: D.footnote, fontWeight: D.weightSemibold, color: detail.tone }}
            onClick={detail.onAct}
          >
            {detail.action}
          </Text>
        </View>
      ) : null}
    </>
  )
}
