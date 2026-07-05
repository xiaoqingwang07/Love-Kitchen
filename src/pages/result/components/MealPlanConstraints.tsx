import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import type { MealConstraint } from '../../../types/mealPlan'
import { MEAL_CONSTRAINT_LABELS } from '../../../types/mealPlan'

type Props = {
  active: MealConstraint[]
  onToggle: (c: MealConstraint) => void
}

export function MealPlanConstraints({ active, onToggle }: Props) {
  return (
    <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
      {(Object.keys(MEAL_CONSTRAINT_LABELS) as MealConstraint[]).map((c) => {
        const on = active.includes(c)
        return (
          <View
            key={c}
            className="tap-scale"
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              backgroundColor: on ? D.accentMuted : D.bgElevated,
              border: `0.5px solid ${on ? D.accent : D.separatorLight}`,
            }}
            onClick={() => onToggle(c)}
          >
            <Text
              style={{
                fontSize: D.caption,
                fontWeight: on ? D.weightSemibold : D.weightMedium,
                color: on ? D.accent : D.labelSecondary,
              }}
            >
              {MEAL_CONSTRAINT_LABELS[c]}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
