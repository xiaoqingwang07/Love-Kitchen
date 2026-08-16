import { View, Text, Button, Image } from '@tarojs/components'
import type { ReactNode } from 'react'
import { D } from '../../../theme/designTokens'
import type { Recipe } from '../../../types/recipe'
import { isRenderableRecipeImage } from '../../../utils/recipeImageUrl'

type Props = {
  recipe: Recipe
  isFavorite: boolean
  onToggleFavorite: () => void
  heroFailed: boolean
  onHeroError: () => void
  contextBar?: ReactNode
}

export function RecipeHero({
  recipe,
  isFavorite,
  onToggleFavorite,
  heroFailed,
  onHeroError,
  contextBar,
}: Props) {
  const heroSrc = isRenderableRecipeImage(recipe.image) ? recipe.image : undefined
  return (
    <View
      style={{
        margin: `16px ${D.pagePadH}px 0`,
        borderRadius: D.radiusXL,
        backgroundColor: D.bgElevated,
        border: `0.5px solid ${D.separatorLight}`,
        overflow: 'hidden',
        boxShadow: D.shadowCard,
        position: 'relative',
      }}
    >
      {heroSrc && !heroFailed ? (
        <Image
          src={heroSrc}
          mode="aspectFill"
          lazyLoad
          style={{ width: '100%', height: 260, display: 'block', backgroundColor: D.bg }}
          onError={onHeroError}
        />
      ) : (
        <View
          style={{
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${D.accentMuted} 0%, ${D.bgElevated} 100%)`,
          }}
        >
          <Text style={{ fontSize: 84, lineHeight: 1 }}>{recipe.emoji || '🥘'}</Text>
        </View>
      )}

      <View
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          gap: 8,
        }}
      >
        <View
          className="tap-scale"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: D.shadowCard,
          }}
          onClick={onToggleFavorite}
        >
          <Text style={{ fontSize: 20, color: isFavorite ? D.accentWarm : D.labelSecondary }}>
            {isFavorite ? '♥' : '♡'}
          </Text>
        </View>
        <Button
          openType="share"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            padding: 0,
            margin: 0,
            backgroundColor: 'rgba(255,255,255,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: D.shadowCard,
            fontSize: 16,
            border: 'none',
            color: D.label,
          }}
        >
          ↗
        </Button>
      </View>

      <View style={{ padding: '20px 22px 22px' }}>
        <Text
          style={{
            fontSize: D.title,
            fontWeight: D.weightBold,
            color: D.label,
            letterSpacing: '-0.03em',
            lineHeight: 1.25,
          }}
        >
          {recipe.title}
        </Text>
        {recipe.quote ? (
          <Text
            style={{
              marginTop: 8,
              fontSize: D.footnote,
              color: D.labelSecondary,
              lineHeight: 1.5,
            }}
          >
            {recipe.quote}
          </Text>
        ) : null}
        {contextBar}
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {recipe.time ? (
            <Text
              style={{
                fontSize: D.caption,
                color: D.labelSecondary,
                backgroundColor: D.bg,
                padding: '5px 10px',
                borderRadius: 999,
                lineHeight: 1.2,
              }}
            >
              {recipe.time} 分钟
            </Text>
          ) : null}
          {recipe.difficulty ? (
            <Text
              style={{
                fontSize: D.caption,
                color: D.labelSecondary,
                backgroundColor: D.bg,
                padding: '5px 10px',
                borderRadius: 999,
                lineHeight: 1.2,
              }}
            >
              {recipe.difficulty}
            </Text>
          ) : null}
          {recipe.tags?.slice(0, 2).map((tag) => (
            <Text
              key={tag}
              style={{
                fontSize: D.caption,
                color: D.accentDeep,
                backgroundColor: D.accentMuted,
                padding: '5px 10px',
                borderRadius: 999,
                lineHeight: 1.2,
              }}
            >
              {tag}
            </Text>
          ))}
        </View>
      </View>
    </View>
  )
}
