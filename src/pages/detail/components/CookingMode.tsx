import { View, Text, Button, Image } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import { formatMMSS, useParallelTimers } from '../../../hooks/useParallelTimers'
import { isRenderableRecipeImage } from '../../../utils/recipeImageUrl'
import type { Recipe, Step } from '../../../types/recipe'

type TimersApi = ReturnType<typeof useParallelTimers>

type Props = {
  recipe: Recipe
  currentStep: number
  onStepChange: (next: number) => void
  onExit: () => void
  onComplete: () => void
  timers: TimersApi
  failedImages: Record<string, true>
  onImageError: (key: string) => void
}

export function CookingMode({
  recipe,
  currentStep,
  onStepChange,
  onExit,
  onComplete,
  timers,
  failedImages,
  onImageError,
}: Props) {
  const steps = recipe.steps as Step[]
  const totalSteps = steps.length
  const step = steps[currentStep]
  const isLastStep = currentStep === totalSteps - 1
  const timerKey = `step-${currentStep}`
  const t = timers.snapshot(timerKey)

  const stepSrc = isRenderableRecipeImage(step.image) ? step.image : undefined

  return (
    <View
      style={{
        minHeight: '100vh',
        backgroundColor: D.cookingBg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <View
        style={{
          padding: '16px 20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: D.cookingMuted, fontSize: 15 }} onClick={onExit}>
          ← 退出
        </Text>
        <Text
          style={{
            color: D.cookingText,
            fontSize: 16,
            fontWeight: D.weightSemibold,
            maxWidth: '60%',
            textAlign: 'center',
          }}
          numberOfLines={1}
        >
          {recipe.title}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <View
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '20px 28px',
        }}
      >
        <Text
          style={{
            fontSize: 68,
            fontWeight: D.weightBold,
            color: D.accentWarm,
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          {currentStep + 1}
          <Text style={{ fontSize: 22, color: D.cookingMuted, fontWeight: D.weightMedium }}>
            /{totalSteps}
          </Text>
        </Text>

        {stepSrc && !failedImages[`cooking-step-${currentStep}`] ? (
          <Image
            src={stepSrc}
            mode="aspectFill"
            style={{
              width: '100%',
              height: 180,
              borderRadius: D.radiusL,
              marginBottom: 22,
              backgroundColor: D.cookingSurface,
            }}
            onError={() => onImageError(`cooking-step-${currentStep}`)}
          />
        ) : null}

        <Text
          style={{
            fontSize: 24,
            color: D.cookingText,
            lineHeight: 1.55,
            marginBottom: 20,
            letterSpacing: '-0.01em',
          }}
        >
          {step.content}
        </Text>

        {step.tip ? (
          <View
            style={{
              fontSize: 14,
              color: D.accentWarm,
              backgroundColor: 'rgba(196,148,74,0.15)',
              padding: '12px 16px',
              borderRadius: D.radiusM,
              marginBottom: 20,
              lineHeight: 1.5,
            }}
          >
            <Text style={{ color: D.accentWarm }}>💡 {step.tip}</Text>
          </View>
        ) : null}

        {step.time && step.time > 0 ? (
          <View style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
            <Text
              style={{
                fontSize: 48,
                fontWeight: D.weightBold,
                color: t && t.running ? D.accentWarm : D.cookingText,
                fontFamily: 'monospace',
              }}
            >
              {formatMMSS(t ? t.remaining : (step.time || 0) * 60)}
            </Text>
            <Button
              style={{
                backgroundColor: t && t.running ? D.cookingSurface : D.accent,
                color: '#fff',
                padding: '0 24px',
                height: 44,
                lineHeight: '44px',
                borderRadius: 999,
                fontSize: 15,
                fontWeight: D.weightSemibold,
                border: 'none',
              }}
              onClick={() => {
                if (t && t.running) timers.pause(timerKey)
                else timers.start(timerKey, (step.time || 1) * 60)
              }}
            >
              {t && t.running ? '暂停' : t && t.remaining > 0 ? '继续' : '开始计时'}
            </Button>
          </View>
        ) : null}
      </View>

      <View style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingBottom: 16 }}>
        {steps.map((_, idx) => (
          <View
            key={idx}
            style={{
              width: idx === currentStep ? 28 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: idx === currentStep ? D.accentWarm : D.cookingSurface,
              transition: 'width 220ms ease',
            }}
          />
        ))}
      </View>

      <View
        style={{
          display: 'flex',
          gap: 12,
          padding: '16px 24px',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
        }}
      >
        <Button
          style={{
            flex: 1,
            height: 52,
            borderRadius: 999,
            fontSize: 16,
            fontWeight: D.weightSemibold,
            backgroundColor: currentStep === 0 ? D.cookingSurface : D.cookingText,
            color: currentStep === 0 ? D.cookingMuted : D.cookingBg,
            opacity: currentStep === 0 ? 0.5 : 1,
            border: 'none',
          }}
          onClick={() => currentStep > 0 && onStepChange(currentStep - 1)}
          disabled={currentStep === 0}
        >
          上一步
        </Button>
        <Button
          style={{
            flex: 1.3,
            height: 52,
            borderRadius: 999,
            fontSize: 16,
            fontWeight: D.weightSemibold,
            backgroundColor: D.accent,
            color: '#fff',
            border: 'none',
          }}
          onClick={() => {
            if (isLastStep) {
              onComplete()
            } else {
              onStepChange(currentStep + 1)
            }
          }}
        >
          {isLastStep ? '完成' : '下一步'}
        </Button>
      </View>
    </View>
  )
}
