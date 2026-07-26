import { View, Text, Image } from '@tarojs/components'
import { D } from '../../../theme/designTokens'
import type { Recipe } from '../../../types/recipe'
import { isRenderableRecipeImage } from '../../../utils/recipeImageUrl'

type Props = {
  recipe: Recipe
  imageKey: string
  imageFailed: boolean
  /** 冰箱联动提示：能用上几样 / 消耗临期 / 还缺什么 */
  pantryHint?: string
  onOpen: () => void
  onToggleFavorite: () => void
  onImageError: () => void
}

export function RecipeResultCard({
  recipe,
  imageKey,
  imageFailed,
  pantryHint,
  onOpen,
  onToggleFavorite,
  onImageError,
}: Props) {
  const displayTitle = recipe.displayTitle || recipe.title
  const imageSrc = isRenderableRecipeImage(recipe.image) ? recipe.image : undefined
  const metaParts: string[] = []
  if (recipe.time) metaParts.push(`${recipe.time} 分钟`)
  if (recipe.difficulty) metaParts.push(recipe.difficulty)

  return (
    <View
      key={recipe.id || imageKey}
      className="tap-scale"
      style={{
        backgroundColor: D.bgElevated,
        borderRadius: D.radiusL,
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        border: `0.5px solid ${D.separatorLight}`,
        boxShadow: D.shadowCard,
      }}
      onClick={onOpen}
    >
      <View
        style={{
          width: 92,
          height: 92,
          background:
            imageSrc && !imageFailed
              ? D.bg
              : `linear-gradient(135deg, ${D.accentMuted} 0%, ${D.bgElevated} 100%)`,
          borderRadius: D.radiusM,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 44,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {imageSrc && !imageFailed ? (
          <Image
            src={imageSrc}
            mode="aspectFill"
            style={{ width: '100%', height: '100%', display: 'block' }}
            lazyLoad
            onError={onImageError}
          />
        ) : (
          <Text style={{ lineHeight: 1 }}>{recipe.emoji || '🥘'}</Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: D.body,
            fontWeight: D.weightSemibold,
            color: D.label,
            marginBottom: 4,
            letterSpacing: '-0.01em',
          }}
        >
          {displayTitle}
        </Text>
        {recipe.quote ? (
          <Text style={{ fontSize: D.caption, color: D.labelSecondary, marginBottom: 8, lineHeight: 1.5 }} numberOfLines={2}>
            {recipe.quote}
          </Text>
        ) : null}
        {pantryHint ? (
          <Text
            style={{
              fontSize: D.caption,
              color: D.accentDeep,
              fontWeight: D.weightMedium,
              marginBottom: 6,
              lineHeight: 1.4,
            }}
            numberOfLines={1}
          >
            {pantryHint}
          </Text>
        ) : null}
        {metaParts.length > 0 ? (
          <View style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {metaParts.map((part, i) => (
              <View key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {i > 0 ? (
                  <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: D.separator }} />
                ) : null}
                <Text style={{ fontSize: D.caption, color: D.labelTertiary }}>{part}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: D.bgGrouped,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite()
        }}
      >
        <Text style={{ color: recipe.isFavorite ? D.accentWarm : D.labelTertiary }}>
          {recipe.isFavorite ? '♥' : '♡'}
        </Text>
      </View>
    </View>
  )
}
