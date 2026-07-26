import { View, Button } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import type { MealPlan } from '../../../types/mealPlan'

type Props = {
  plan: MealPlan
  ingredientsParam?: string
  loading?: boolean
  disabled?: boolean
  onStartMain: () => void
  onShare: () => void
}

export function MealPlanActions({ plan, loading, disabled, onStartMain, onShare }: Props) {
  const main = plan.recipes.find((s) => s.role === 'main')?.recipe
  if (!main) return null

  return (
    <View style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
      <Button
        className="tap-scale"
        loading={loading}
        disabled={disabled || loading}
        onClick={onStartMain}
        style={{
          height: 48,
          borderRadius: 999,
          backgroundColor: D.accent,
          color: D.onAccent,
          fontSize: D.subheadline,
          fontWeight: D.weightSemibold,
          border: 'none',
          lineHeight: '48px',
        }}
      >
        开始做主菜
      </Button>
      <Button
        openType="share"
        onClick={onShare}
        style={{
          height: 44,
          borderRadius: 999,
          backgroundColor: D.accentMuted,
          color: D.accentDeep,
          fontSize: D.subheadline,
          fontWeight: D.weightSemibold,
          border: 'none',
        }}
      >
        分享今晚方案
      </Button>
    </View>
  )
}
