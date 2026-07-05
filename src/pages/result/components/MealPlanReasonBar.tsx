import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import type { MealPlan } from '../../../types/mealPlan'

type Props = {
  plan: MealPlan
  expiringNames?: string[]
}

/** 解释推荐依据：用了哪些冰箱食材、临期优先、缺货情况 */
export function MealPlanReasonBar({ plan, expiringNames = [] }: Props) {
  const used = plan.usedPantryItems.slice(0, 6)
  const expiringHit = expiringNames.filter((n) =>
    plan.recipes.some((s) => s.expiringUsed.includes(n))
  )

  return (
    <View
      style={{
        margin: `0 ${D.pagePadH}px 12px`,
        padding: 14,
        borderRadius: D.radiusM,
        backgroundColor: D.accentMuted,
        border: `0.5px solid ${D.separatorLight}`,
      }}
    >
      <Text style={{ fontSize: D.caption, fontWeight: D.weightSemibold, color: D.accent }}>
        为什么推荐这些？
      </Text>
      {used.length > 0 ? (
        <Text style={{ fontSize: D.footnote, color: D.labelSecondary, marginTop: 8, lineHeight: 1.5 }}>
          已用冰箱：{used.join('、')}
          {plan.usedPantryItems.length > used.length ? ' 等' : ''}
        </Text>
      ) : null}
      {expiringHit.length > 0 ? (
        <Text style={{ fontSize: D.footnote, color: D.accentWarm, marginTop: 6, lineHeight: 1.5 }}>
          优先消耗临期：{expiringHit.join('、')}
        </Text>
      ) : null}
      <Text style={{ fontSize: D.footnote, color: D.labelSecondary, marginTop: 6, lineHeight: 1.5 }}>
        {plan.missingItems.length > 0
          ? `还缺 ${plan.missingItems.length} 样可加入采购清单`
          : '冰箱食材基本够用，可以直接开做'}
      </Text>
    </View>
  )
}
