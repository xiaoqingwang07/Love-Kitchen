import { View, Text, Button } from '@tarojs/components'
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
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginTop: 8,
      }}
    >
      <Button
        className="tap-scale"
        loading={loading}
        disabled={disabled || loading}
        onClick={onStartMain}
        style={{
          flex: 1,
          height: 48,
          borderRadius: 999,
          backgroundColor: D.accent,
          color: D.onAccent,
          fontSize: D.body,
          fontWeight: D.weightSemibold,
          border: 'none',
          lineHeight: '48px',
          padding: 0,
          margin: 0,
        }}
      >
        开始做主菜
      </Button>
      <Button
        openType="share"
        onClick={onShare}
        style={{
          flexShrink: 0,
          height: 48,
          padding: '0 4px',
          margin: 0,
          backgroundColor: 'transparent',
          color: D.accentDeep,
          fontSize: D.subheadline,
          fontWeight: D.weightMedium,
          border: 'none',
          lineHeight: '48px',
        }}
      >
        分享
      </Button>
    </View>
  )
}
