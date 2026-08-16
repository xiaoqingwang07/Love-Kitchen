import { View, Text } from '@tarojs/components'
import { D, mediaRowTextCol } from '../../../theme/designTokens'
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
          style={{ fontSize: D.footnote, color: D.accentDeep, fontWeight: D.weightSemibold }}
          onClick={onOpenShopping}
        >
          待买清单 →
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
              <View style={mediaRowTextCol}>
                <Text className="lk-block" style={{ fontSize: D.subheadline, color: D.label, fontWeight: D.weightMedium, lineHeight: 1.25 }}>
                  {ing.name}
                </Text>
                <Text className="lk-block" style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 3, lineHeight: 1.25 }}>{ing.amount}</Text>
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
