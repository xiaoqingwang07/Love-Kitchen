import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import { findPantryItemForRecipeIngredient } from '../../../utils/ingredientMatch'
import type { Ingredient } from '../../../types/recipe'
import type { PantryItem } from '../../../types/pantry'

type Props = {
  ingredients: Ingredient[]
  pantryItems: PantryItem[]
  onOpenShopping: () => void
}

export function IngredientGrid({ ingredients, pantryItems, onOpenShopping }: Props) {
  if (!ingredients.length) return null

  return (
    <View style={{ padding: `28px ${D.pagePadH}px 8px` }}>
      <View
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: D.caption,
            fontWeight: D.weightSemibold,
            color: D.labelSecondary,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
          }}
        >
          用料
        </Text>
        <Text
          className="tap-scale"
          style={{ fontSize: D.footnote, color: D.accent, fontWeight: D.weightSemibold }}
          onClick={onOpenShopping}
        >
          采购清单 →
        </Text>
      </View>
      <View style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {ingredients.map((ing, idx) => {
          const hasIt = !!findPantryItemForRecipeIngredient(pantryItems, ing.name)
          return (
            <View
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                backgroundColor: D.bgElevated,
                borderRadius: D.radiusM,
                border: `0.5px solid ${D.separatorLight}`,
                gap: 6,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: D.subheadline, color: D.label, fontWeight: D.weightMedium }}>
                  {ing.name}
                </Text>
                <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 2 }}>{ing.amount}</Text>
              </View>
              {hasIt ? (
                <Text
                  style={{
                    fontSize: 10,
                    color: D.green,
                    backgroundColor: 'rgba(74,140,108,0.12)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontWeight: D.weightSemibold,
                  }}
                >
                  有
                </Text>
              ) : null}
            </View>
          )
        })}
      </View>
    </View>
  )
}
