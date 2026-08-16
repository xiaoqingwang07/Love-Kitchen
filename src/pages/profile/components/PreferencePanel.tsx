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
      <View
        style={{
          backgroundColor: D.bgElevated,
          borderRadius: D.radiusM,
          padding: '12px 14px',
          marginBottom: 10,
          border: `0.5px solid ${D.separatorLight}`,
        }}
      >
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.label }}>
            推荐
          </Text>
          <View style={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
            {sceneOptions.map(({ key, label }) => (
              <View
                key={key}
                className="tap-scale"
                style={{
                  padding: '4px 12px',
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
            height: 0.5,
            backgroundColor: D.separatorLight,
            marginTop: 12,
            marginBottom: 12,
          }}
        />

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
        <Text style={{ flex: 1, fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.label }}>
          就餐人数
        </Text>
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
            <Text style={{ fontSize: 18, color: D.onAccent }}>+</Text>
          </View>
        </View>
        </View>
      </View>
    </>
  )
}
