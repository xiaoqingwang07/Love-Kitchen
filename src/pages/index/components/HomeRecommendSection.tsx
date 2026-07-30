import { View, Text, Image } from '@tarojs/components'
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
  onCardClick: (item: Recipe) => void
}

export function HomeRecommendSection({
  recipes,
  reason,
  weather,
  weatherLoading,
  onEnableWeather,
  onRefresh,
  onCardClick,
}: Props) {
  const [failedIds, setFailedIds] = useState<Record<string, true>>({})

  return (
    <View style={S.recipesSectionStyle}>
      {/* 头部收敛为一行：原有「今日推荐」标签与 reason 文案是同一件事说两遍，
          下面还跟一句长解释，属于低价值重复，已合并。 */}
      <View style={S.sectionHeaderStyle}>
        <Text style={S.sectionLeadStyle}>
          {weather ? `${weather.temperature}°C · 按实时天气挑的` : reason}
        </Text>
        <View style={S.sectionActionsStyle}>
          {!weather ? (
            <Text className="tap-scale" style={S.sectionActionStyle} onClick={onEnableWeather}>
              {weatherLoading ? '获取中…' : '按天气'}
            </Text>
          ) : null}
          <Text className="tap-scale" style={S.sectionActionStyle} onClick={onRefresh}>
            换一批
          </Text>
        </View>
      </View>

      {/* 竖向列表 + 横向紧凑卡：图在左、字在右。
          原为横向滚动的竖卡片，单张占屏高且需要横划才能看全。 */}
      <View style={S.recommendListStyle}>
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
                  <Text style={{ fontSize: 32 }}>
                    {recipePlaceholderEmoji(displayTitle, item.tags)}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text className="lk-block" style={S.recommendTitleStyle}>
                  {displayTitle}
                </Text>
                <Text className="lk-block" style={S.recommendMetaStyle}>
                  {item.time ? `${item.time} 分钟` : '家常'} · {item.difficulty || '简单'}
                </Text>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}
