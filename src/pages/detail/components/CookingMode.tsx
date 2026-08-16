import { View, Text, Image } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import { BackChevron } from '../../../components/BackChevron'
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
          padding: '8px 16px',
          paddingTop: 'calc(8px + env(safe-area-inset-top))',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View
          className="tap-scale"
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(247, 244, 241, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          onClick={onExit}
        >
          <BackChevron color={D.cookingText} size={16} />
        </View>
        <Text
          style={{
            flex: 1,
            color: D.cookingText,
            fontSize: 17,
            fontWeight: D.weightSemibold,
            textAlign: 'center',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            padding: '0 12px',
          }}
          numberOfLines={1}
        >
          {recipe.title}
        </Text>
        <View style={{ width: 36, flexShrink: 0 }} />
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
              backgroundColor: 'rgba(196,148,74,0.15)',
              padding: '8px 14px',
              borderRadius: D.radiusS,
              marginBottom: 20,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: D.accentWarm, fontSize: 14, lineHeight: 1.4 }}>{step.tip}</Text>
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
            <View
              className="tap-scale"
              style={{
                backgroundColor: t && t.running ? D.cookingSurface : D.accent,
                padding: '0 22px',
                height: 40,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => {
                if (t && t.running) timers.pause(timerKey)
                else timers.start(timerKey, (step.time || 1) * 60)
              }}
            >
              <Text
                style={{
                  color: t && t.running ? D.cookingText : D.onAccent,
                  fontSize: 15,
                  fontWeight: D.weightSemibold,
                  lineHeight: 1.2,
                }}
              >
                {t && t.running ? '暂停' : t && t.remaining > 0 ? '继续' : '开始计时'}
              </Text>
            </View>
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
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          padding: '12px 24px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        }}
      >
        <View
          className="tap-scale"
          style={{
            height: 48,
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            opacity: currentStep === 0 ? 0.35 : 1,
          }}
          onClick={() => currentStep > 0 && onStepChange(currentStep - 1)}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: D.weightMedium,
              color: D.cookingText,
              lineHeight: 1.2,
            }}
          >
            上一步
          </Text>
        </View>
        <View
          className="tap-scale"
          style={{
            flex: 1,
            height: 48,
            borderRadius: 999,
            backgroundColor: D.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => {
            if (isLastStep) {
              onComplete()
            } else {
              onStepChange(currentStep + 1)
            }
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: D.weightSemibold,
              color: D.onAccent,
              lineHeight: 1.2,
            }}
          >
            {isLastStep ? '完成' : '下一步'}
          </Text>
        </View>
      </View>
    </View>
  )
}
