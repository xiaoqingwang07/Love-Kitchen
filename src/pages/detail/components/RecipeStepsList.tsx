import { View, Text, Image } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import { formatMMSS, useParallelTimers } from '../../../hooks/useParallelTimers'
import { isRenderableRecipeImage } from '../../../utils/recipeImageUrl'
import type { Step } from '../../../types/recipe'

type TimersApi = ReturnType<typeof useParallelTimers>

type Props = {
  steps: Step[]
  timers: TimersApi
  failedImages: Record<string, true>
  onStepImageError: (key: string) => void
}

export function RecipeStepsList({ steps, timers, failedImages, onStepImageError }: Props) {
  if (!steps.length) return null

  return (
    <View style={{ padding: `8px ${D.pagePadH}px 28px` }}>
      <Text
        style={{
          fontSize: D.caption,
          fontWeight: D.weightSemibold,
          color: D.labelSecondary,
          marginBottom: 16,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
        }}
      >
        步骤
      </Text>
      {steps.map((step, idx) => {
        const timerKey = `ns-${idx}`
        const t = timers.snapshot(timerKey)
        const stepSrc = isRenderableRecipeImage(step.image) ? step.image : undefined
        return (
          <View
            key={idx}
            style={{
              marginBottom: 16,
              display: 'flex',
              gap: 12,
              padding: '14px 14px',
              backgroundColor: D.bgElevated,
              borderRadius: D.radiusM,
              border: `0.5px solid ${D.separatorLight}`,
            }}
          >
            <View
              style={{
                width: 30,
                height: 30,
                backgroundColor: D.accent,
                borderRadius: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: D.weightBold, fontSize: 13 }}>{idx + 1}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              {stepSrc && !failedImages[`step-${idx}`] ? (
                <Image
                  src={stepSrc}
                  mode="aspectFill"
                  style={{
                    width: '100%',
                    height: 156,
                    borderRadius: D.radiusM,
                    marginBottom: 12,
                    backgroundColor: D.bgGrouped,
                  }}
                  onError={() => onStepImageError(`step-${idx}`)}
                />
              ) : null}
              <Text style={{ fontSize: D.body, color: D.label, lineHeight: 1.6 }}>{step.content}</Text>
              {step.tip ? (
                <View
                  style={{
                    fontSize: D.footnote,
                    color: D.accentWarm,
                    backgroundColor: D.accentWarmMuted,
                    padding: '8px 12px',
                    borderRadius: D.radiusS,
                    marginTop: 10,
                  }}
                >
                  <Text style={{ fontSize: D.footnote, color: D.accentWarm }}>💡 {step.tip}</Text>
                </View>
              ) : null}
              {step.time && step.time > 0 ? (
                <View style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                  <Text
                    style={{
                      fontSize: D.footnote,
                      color: t && t.running ? D.accentWarm : D.labelTertiary,
                      fontFamily: 'monospace',
                      fontWeight: D.weightSemibold,
                    }}
                  >
                    {formatMMSS(t ? t.remaining : step.time * 60)}
                  </Text>
                  <Text
                    className="tap-scale"
                    style={{
                      fontSize: D.caption,
                      fontWeight: D.weightSemibold,
                      color: t && t.running ? D.errorFg : D.accent,
                      backgroundColor: t && t.running ? D.errorBg : D.accentMuted,
                      padding: '4px 12px',
                      borderRadius: 999,
                    }}
                    onClick={() => {
                      if (t && t.running) {
                        timers.pause(timerKey)
                      } else {
                        timers.start(timerKey, step.time! * 60)
                      }
                    }}
                  >
                    {t && t.running ? '暂停' : t && t.remaining > 0 ? '继续' : '计时 ' + step.time + ' 分'}
                  </Text>
                  {t && !t.running && t.remaining > 0 ? (
                    <Text
                      className="tap-scale"
                      style={{ fontSize: D.caption, color: D.labelTertiary }}
                      onClick={() => timers.reset(timerKey)}
                    >
                      重置
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        )
      })}
    </View>
  )
}
