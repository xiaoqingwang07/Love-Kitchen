import { View, Text } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import type { SceneType } from '../../../types/recipe'

type SceneOption = { key: SceneType; label: string }

type Props = {
  recipeScene: SceneType
  dinersCount: number
  sceneOptions: SceneOption[]
  onSceneChange: (scene: SceneType) => void
  onDinersChange: (delta: number) => void
}

export function PreferencePanel({
  recipeScene,
  dinersCount,
  sceneOptions,
  onSceneChange,
  onDinersChange,
}: Props) {
  return (
    <>
      <Text
        style={{
          fontSize: D.caption,
          fontWeight: D.weightSemibold,
          color: D.labelSecondary,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          marginBottom: 10,
        }}
      >
        偏好
      </Text>

      <View
        style={{
          backgroundColor: D.bgElevated,
          borderRadius: D.radiusM,
          padding: 16,
          marginBottom: 10,
          border: `0.5px solid ${D.separatorLight}`,
        }}
      >
        <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.label }}>
          推荐场景
        </Text>
        <Text className="lk-block" style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 4, lineHeight: 1.5 }}>
          AI 出菜时会按这个场景调整语气、步骤和营养侧重
        </Text>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {sceneOptions.map(({ key, label }) => (
            <View
              key={key}
              className="tap-scale"
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                backgroundColor: recipeScene === key ? D.label : D.bg,
                border: recipeScene === key ? 'none' : `0.5px solid ${D.separator}`,
              }}
              onClick={() => onSceneChange(key)}
            >
              <Text
                style={{
                  fontSize: D.footnote,
                  fontWeight: D.weightSemibold,
                  color: recipeScene === key ? D.bgElevated : D.labelSecondary,
                }}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View
        style={{
          backgroundColor: D.bgElevated,
          borderRadius: D.radiusM,
          padding: 16,
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          border: `0.5px solid ${D.separatorLight}`,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.label }}>
            默认就餐人数
          </Text>
          <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 4 }}>份量推荐时的参考值</Text>
        </View>
        <View style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <View
            className="tap-scale"
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: D.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `0.5px solid ${D.separator}`,
            }}
            onClick={() => onDinersChange(-1)}
          >
            <Text style={{ fontSize: 18, color: D.label }}>−</Text>
          </View>
          <Text
            style={{
              fontSize: D.headline,
              fontWeight: D.weightBold,
              color: D.label,
              minWidth: 24,
              textAlign: 'center',
            }}
          >
            {dinersCount}
          </Text>
          <View
            className="tap-scale"
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: D.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => onDinersChange(1)}
          >
            <Text style={{ fontSize: 18, color: '#fff' }}>+</Text>
          </View>
        </View>
      </View>
    </>
  )
}
