import { View, Text, Image } from '@tarojs/components'
import { useState } from 'react'
import { enrichRecipeMedia } from '../../../utils/enrichRecipeMedia'
import { isStapleIngredient } from '../../../utils/recipeIngredientFilter'
import { recipePlaceholderEmoji } from '../../../utils/recipePlaceholderEmoji'
import { isRenderableRecipeImage } from '../../../utils/recipeImageUrl'
import type { Recipe } from '../../../types/recipe'
import { mediaRowTextCol } from '../../../theme/designTokens'
import * as S from '../styles'

type Props = {
  recipes: Recipe[]
  /** 冰箱里现有食材名，用于算「有几样 / 缺几样」 */
  pantryNames: string[]
  reason: string
  weather: { temperature: number } | null
  weatherLoading: boolean
  onEnableWeather: () => void
  onRefresh: () => void
  onCardClick: (item: Recipe) => void
}

function sectionCopy(
  reason: string,
  weather: { temperature: number } | null
): { title: string; caption: string } {
  if (weather) {
    return { title: '适合今天', caption: `${weather.temperature}°C · 按实时天气` }
  }
  if (reason.includes('口味')) {
    return { title: '猜你想吃', caption: '按你常做的口味' }
  }
  return { title: '今日家常', caption: '高分、好做' }
}

function stockHint(recipe: Recipe, pantryNames: string[]): { kind: 'ready' | 'have'; text: string } | null {
  const names = (recipe.ingredients ?? [])
    .map((i) => i.name)
    .filter((n) => n && !isStapleIngredient(n))
  if (names.length === 0) return null
  const have = names.filter((n) => pantryNames.some((p) => p.includes(n) || n.includes(p)))
  if (have.length === 0) return null
  if (have.length >= names.length) return { kind: 'ready', text: '食材齐了' }
  return { kind: 'have', text: `能用上 ${have.length} 样` }
}

export function HomeRecommendSection({
  recipes,
  pantryNames,
  reason,
  weather,
  weatherLoading,
  onEnableWeather,
  onRefresh,
  onCardClick,
}: Props) {
  const [failedIds, setFailedIds] = useState<Record<string, true>>({})
  const { title, caption } = sectionCopy(reason, weather)

  return (
    <View style={S.recipesSectionStyle}>
      <View style={S.sectionHeaderStyle}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text className="lk-block" style={S.sectionTitleStyle}>
            {title}
          </Text>
          <Text className="lk-block" style={S.sectionLeadStyle}>
            {caption}
          </Text>
        </View>
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

      <View style={S.recommendListStyle}>
        {recipes.map((raw, idx) => {
          const item = enrichRecipeMedia({ ...raw, source: raw.source ?? 'local' })
          const displayTitle = item.displayTitle || item.title
          const failKey = `${String(item.id)}-${idx}`
          const imageSrc = isRenderableRecipeImage(item.image) ? item.image : undefined
          const stock = stockHint(item, pantryNames)
          return (
            <View key={`rec-${failKey}`}>
              {idx > 0 ? <View style={S.recommendDividerStyle} /> : null}
              <View className="tap-scale" style={S.recommendCardStyle} onClick={() => onCardClick(item)}>
                <View style={S.recommendThumbStyle}>
                  {imageSrc && !failedIds[failKey] ? (
                    <Image
                      src={imageSrc}
                      mode="aspectFill"
                      style={{ width: '100%', height: '100%' }}
                      onError={() => setFailedIds((prev) => ({ ...prev, [failKey]: true }))}
                    />
                  ) : (
                    <Text style={{ fontSize: 36 }}>
                      {item.emoji || recipePlaceholderEmoji(displayTitle, item.tags)}
                    </Text>
                  )}
                </View>
                <View style={mediaRowTextCol}>
                  <Text className="lk-block" style={S.recommendTitleStyle} numberOfLines={1}>
                    {displayTitle}
                  </Text>
                  <Text className="lk-block" style={S.recommendMetaStyle}>
                    {item.time ? `${item.time} 分钟` : '家常'}
                    {item.difficulty ? ` · ${item.difficulty}` : ''}
                  </Text>
                  {stock ? (
                    <View style={S.recommendStockRowStyle}>
                      <Text
                        style={
                          stock.kind === 'ready' ? S.recommendStockReadyStyle : S.recommendStockHaveStyle
                        }
                      >
                        {stock.text}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}
