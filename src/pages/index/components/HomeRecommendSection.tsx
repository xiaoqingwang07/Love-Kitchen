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
        {/* 动作用 View 包一层撑出可点区域：原先是裸 Text，真机上命中区只有
            文字本身那几十像素，手指点不中，表现为「点了没反应」 */}
        <View style={S.sectionActionsStyle}>
          {!weather ? (
            <View className="tap-scale" style={S.sectionActionHitStyle} onClick={onEnableWeather}>
              <Text style={S.sectionActionStyle}>{weatherLoading ? '获取中…' : '按天气'}</Text>
            </View>
          ) : null}
          <View className="tap-scale" style={S.sectionActionHitStyle} onClick={onRefresh}>
            <Text style={S.sectionActionStyle}>换一批</Text>
          </View>
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
              {/* 无真实照片时回退 emoji，优先用菜谱自带的那个：它是按菜品人工标注的
                  （红烧蹄髈 = 🍖），比按标签反推准确得多（按「猪肉」标签会算出 🥩 生牛排） */}
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
                    {item.emoji || recipePlaceholderEmoji(displayTitle, item.tags)}
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
