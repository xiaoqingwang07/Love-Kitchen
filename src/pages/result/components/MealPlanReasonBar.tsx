import { View, Text } from '@tarojs/components'
import { D, mediaRowTextCol } from '../../../theme/designTokens'
import type { MealPlan } from '../../../types/mealPlan'

type Props = {
  plan: MealPlan
  expiringNames?: string[]
}

/** 一行说明，不再做成第二张色块卡。 */
export function MealPlanReasonBar({ plan, expiringNames = [] }: Props) {
  const used = plan.usedPantryItems.slice(0, 6)
  const expiringHit = expiringNames.filter((n) =>
    plan.recipes.some((s) => s.expiringUsed.includes(n))
  )

  const lead =
    expiringHit.length > 0
      ? `先用掉 ${expiringHit.join('、')}`
      : used.length > 0
        ? `已用冰箱：${used.join('、')}${plan.usedPantryItems.length > used.length ? ' 等' : ''}`
        : '按家常搭配给出方案'

  const detail =
    plan.missingItems.length > 0
      ? `还缺 ${plan.missingItems.length} 样主料，可加入待买`
      : used.length > 0 && expiringHit.length > 0
        ? `已用冰箱：${used.join('、')}`
        : '冰箱食材基本够用，可以直接开做'

  return (
    <View
      style={{
        marginBottom: 14,
        padding: '10px 12px',
        borderRadius: D.radiusS,
        backgroundColor: D.bgGrouped,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: expiringHit.length > 0 ? D.accentWarm : D.green,
          flexShrink: 0,
        }}
      />
      <View style={mediaRowTextCol}>
        <Text
          className="lk-block"
          style={{ fontSize: D.footnote, fontWeight: D.weightMedium, color: D.label, lineHeight: 1.35 }}
        >
          {lead}
        </Text>
        <Text
          className="lk-block"
          style={{ fontSize: D.caption, color: D.labelSecondary, marginTop: 3, lineHeight: 1.35 }}
        >
          {detail}
        </Text>
      </View>
    </View>
  )
}
