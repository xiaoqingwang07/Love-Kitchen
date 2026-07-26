import { View, Text, Image } from '@tarojs/components'
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { D } from '../../../theme/designTokens'
import type { MealPlan } from '../../../types/mealPlan'
import { mealRoleLabel } from '../../../utils/mealPlanBuilder'
import { recipePlaceholderEmoji } from '../../../utils/recipePlaceholderEmoji'
import { isRenderableRecipeImage } from '../../../utils/recipeImageUrl'
import type { Recipe } from '../../../types/recipe'

type Props = {
  plan: MealPlan
  selected?: boolean
  onSelect?: () => void
  onOpenRecipe?: (recipe: Recipe) => void
  onAddShopping?: () => void
}

export function MealPlanCard({ plan, selected, onSelect, onOpenRecipe, onAddShopping }: Props) {
  const [failedIds, setFailedIds] = useState<Record<string, true>>({})
  const safeRatio = Math.max(0, Math.min(1, plan.expiringConsumeRatio || 0))

  const cardStyle: CSSProperties = {
    backgroundColor: D.bgElevated,
    borderRadius: D.radiusM,
    padding: 16,
    marginBottom: 12,
    border: selected ? `2px solid ${D.accent}` : `0.5px solid ${D.separatorLight}`,
    boxShadow: D.shadowCard,
  }

  return (
    <View style={cardStyle} onClick={onSelect}>
      {plan.recipes.map((slot) => {
        const displayTitle = slot.recipe.displayTitle || slot.recipe.title
        const failKey = `${slot.role}-${slot.recipe.id}`
        const imageSrc = isRenderableRecipeImage(slot.recipe.image) ? slot.recipe.image : undefined
        return (
          <View
            key={failKey}
            style={{ display: 'flex', flexDirection: 'row', gap: 12, marginBottom: 12 }}
            onClick={(e) => {
              e.stopPropagation()
              onOpenRecipe?.(slot.recipe)
            }}
          >
            {imageSrc && !failedIds[failKey] ? (
              <Image
                src={imageSrc}
                mode="aspectFill"
                style={{ width: 64, height: 64, borderRadius: 10, flexShrink: 0 }}
                onError={() => setFailedIds((prev) => ({ ...prev, [failKey]: true }))}
              />
            ) : (
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 10,
                  backgroundColor: D.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Text style={{ fontSize: 28 }}>
                  {slot.recipe.emoji || recipePlaceholderEmoji(displayTitle, slot.recipe.tags)}
                </Text>
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: D.caption, color: D.accentDeep, fontWeight: D.weightSemibold }}>
                {mealRoleLabel(slot.role)}
              </Text>
              <Text
                style={{
                  fontSize: D.subheadline,
                  fontWeight: D.weightSemibold,
                  color: D.label,
                  display: 'block',
                  marginTop: 2,
                }}
              >
                {displayTitle}
              </Text>
              <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 4 }}>
                {slot.recipe.time ?? 15} 分钟
                {slot.expiringUsed.length > 0
                  ? ` · 消耗临期 ${slot.expiringUsed.join('、')}`
                  : ''}
              </Text>
            </View>
          </View>
        )
      })}

      <Text style={{ fontSize: D.footnote, color: D.labelSecondary, lineHeight: 1.5 }}>
        {plan.reason}
      </Text>

      <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        <Text style={{ fontSize: D.caption, color: D.labelTertiary }}>
          总耗时约 {plan.totalTime} 分钟 · {plan.servings} 人份
        </Text>
        {safeRatio > 0 ? (
          <Text style={{ fontSize: D.caption, color: D.accentWarm }}>
            临期消耗 {Math.round(safeRatio * 100)}%
          </Text>
        ) : null}
      </View>

      {plan.missingItems.length > 0 ? (
        <View style={{ marginTop: 10 }}>
          <Text style={{ fontSize: D.caption, color: D.labelSecondary }}>
            还缺：{plan.missingItems.map((m) => m.name).join('、')}
          </Text>
          {onAddShopping ? (
            <Text
              style={{
                fontSize: D.caption,
                color: D.accentDeep,
                fontWeight: D.weightSemibold,
                marginTop: 6,
              }}
              onClick={(e) => {
                e.stopPropagation()
                onAddShopping()
              }}
            >
              加入采购清单
            </Text>
          ) : null}
        </View>
      ) : (
        <Text style={{ fontSize: D.caption, color: D.green, marginTop: 10 }}>
          冰箱食材够用
        </Text>
      )}
    </View>
  )
}
