import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState } from 'react'
import { enrichRecipeMedia } from '../../../utils/enrichRecipeMedia'
import { recipePlaceholderEmoji } from '../../../utils/recipePlaceholderEmoji'
import { isRenderableRecipeImage } from '../../../utils/recipeImageUrl'
import type { Recipe } from '../../../types/recipe'
import * as S from '../styles'

type Props = {
  recipes: Recipe[]
  reason: string
  weather: { temperature: number } | null
  weatherLoading: boolean
  onEnableWeather: () => void
  onRefresh: () => void
  onRandom: () => void
  onCardClick: (item: Recipe) => void
}

export function HomeRecommendSection({
  recipes,
  reason,
  weather,
  weatherLoading,
  onEnableWeather,
  onRefresh,
  onRandom,
  onCardClick,
}: Props) {
  const [failedIds, setFailedIds] = useState<Record<string, true>>({})

  return (
    <View style={S.recipesSectionStyle}>
      <View style={S.sectionHeaderStyle}>
        <Text style={S.sectionTitleStyle}>今日推荐</Text>
        <Text style={S.sectionLeadStyle}>{reason}</Text>
        <View style={S.sectionMetaRowStyle}>
          <Text style={S.sectionMetaTextStyle}>
            {weather
              ? `${weather.temperature}°C · 已按实时天气调整`
              : '按家常口味与评分排序，开启天气后会参考气温冷热'}
          </Text>
          <View style={S.sectionActionsStyle}>
            {!weather ? (
              <Text className="tap-scale" style={S.sectionActionStyle} onClick={onEnableWeather}>
                {weatherLoading ? '获取中…' : '开启天气'}
              </Text>
            ) : null}
            <Text className="tap-scale" style={S.sectionActionStyle} onClick={onRefresh}>
              换一批
            </Text>
            <Text className="tap-scale" style={S.sectionActionStyle} onClick={onRandom}>
              更多
            </Text>
          </View>
        </View>
      </View>

      <ScrollView scrollX showScrollbar={false} style={S.recommendScrollStyle}>
        {recipes.map((raw, idx) => {
          const item = enrichRecipeMedia({ ...raw, source: raw.source ?? 'local' })
          const displayTitle = item.displayTitle || item.title
          const failKey = `${String(item.id)}-${idx}`
          const imageSrc = isRenderableRecipeImage(item.image) ? item.image : undefined
          return (
            <View
              key={`rec-${failKey}`}
              className="tap-scale"
              style={S.recommendCardStyle}
              onClick={() => onCardClick(item)}
            >
              <View style={S.recommendThumbStyle}>
                {imageSrc && !failedIds[failKey] ? (
                  <Image
                    src={imageSrc}
                    mode="aspectFill"
                    style={{ width: '100%', height: '100%' }}
                    onError={() => setFailedIds((prev) => ({ ...prev, [failKey]: true }))}
                  />
                ) : (
                  <Text style={{ fontSize: 40 }}>
                    {recipePlaceholderEmoji(displayTitle, item.tags)}
                  </Text>
                )}
              </View>
              <Text style={S.recommendTitleStyle}>{displayTitle}</Text>
              <Text style={S.recommendMetaStyle}>
                {item.time ? `${item.time} 分钟` : '家常'} · {item.difficulty || '简单'}
              </Text>
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}
