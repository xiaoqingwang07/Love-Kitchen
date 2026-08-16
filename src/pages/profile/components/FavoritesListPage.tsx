import { View, Text, ScrollView, Image } from '@tarojs/components'
import { SubpageHeader } from '../../../components/SubpageHeader'
import { D, mediaRowTextCol } from '../../../theme/designTokens'
import { enrichRecipeMedia } from '../../../utils/enrichRecipeMedia'
import type { Recipe } from '../../../types/recipe'

type Props = {
  items: Recipe[]
  onBack: () => void
  onOpenRecipe: (recipe: Recipe) => void
  onUnfavorite: (recipe: Recipe) => void
}

export function FavoritesListPage({ items, onBack, onOpenRecipe, onUnfavorite }: Props) {
  const isEmpty = items.length === 0

  return (
    <View style={{ minHeight: '100vh', backgroundColor: D.bg }}>
      <SubpageHeader title="收藏" onBack={onBack} />
      <ScrollView scrollY style={{ padding: '16px 22px 40px' }}>
        {isEmpty ? (
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: 64,
            }}
          >
            <Text style={{ fontSize: 52, marginBottom: 16 }}>♡</Text>
            <Text
              style={{
                fontSize: D.body,
                fontWeight: D.weightSemibold,
                color: D.label,
                marginBottom: 6,
              }}
            >
              还没有收藏
            </Text>
            <Text className="lk-block"
              style={{
                fontSize: D.footnote,
                color: D.labelTertiary,
                textAlign: 'center',
                padding: '0 40px',
                lineHeight: 1.5,
              }}
            >
              在推荐列表点 ♡ 就能收藏到这里
            </Text>
          </View>
        ) : (
          items.map((item, idx) => {
            const r = enrichRecipeMedia(item)
            return (
              <View
                key={String(r.id ?? idx)}
                className="tap-scale"
                style={{
                  backgroundColor: D.bgElevated,
                  borderRadius: D.radiusM,
                  padding: 14,
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  border: `0.5px solid ${D.separatorLight}`,
                  boxShadow: D.shadowCard,
                }}
                onClick={() => onOpenRecipe(r)}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    backgroundColor: D.bg,
                    borderRadius: D.radiusS,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {r.image ? (
                    <Image src={r.image} mode="aspectFill" style={{ width: '100%', height: '100%' }} lazyLoad />
                  ) : (
                    <Text style={{ fontSize: 28 }}>{r.emoji || '🥘'}</Text>
                  )}
                </View>
                <View style={mediaRowTextCol}>
                  <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.label }}>
                    {r.title}
                  </Text>
                  <Text
                    style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 4 }}
                    numberOfLines={1}
                  >
                    {r.quote || r.nutritionAnalysis || '点开查看做法'}
                  </Text>
                </View>
                <Text
                  style={{ fontSize: 22, color: D.accentWarm, padding: '0 6px' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onUnfavorite(r)
                  }}
                >
                  ♥
                </Text>
              </View>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}
