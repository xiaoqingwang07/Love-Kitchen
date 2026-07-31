import { View, Text } from '@tarojs/components'
import type { MealConstraint } from '../../../types/mealPlan'
import { MealPlanConstraints } from './MealPlanConstraints'
import { resultPageStyles as S } from '../resultPageStyles'

type Props = {
  title: string
  subtitle: string
  isMealMode: boolean
  mealConstraints: MealConstraint[]
  showAiRegen: boolean
  isLoading: boolean
  onToggleConstraint: (c: MealConstraint) => void
  onRegenerateAi: () => void
}

export function ResultPageHeader({
  title,
  subtitle,
  isMealMode,
  mealConstraints,
  showAiRegen,
  isLoading,
  onToggleConstraint,
  onRegenerateAi,
}: Props) {
  return (
    <View style={S.header}>
      <Text className="lk-title" style={S.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text className="lk-block" style={S.subtitle}>
          {subtitle}
        </Text>
      ) : null}
      {isMealMode ? (
        <MealPlanConstraints active={mealConstraints} onToggle={onToggleConstraint} />
      ) : null}
      {showAiRegen && !isLoading ? (
        <View className="tap-scale" style={S.regenBtn} onClick={onRegenerateAi}>
          <Text>↻</Text>
          <Text>换个思路</Text>
        </View>
      ) : null}
    </View>
  )
}
