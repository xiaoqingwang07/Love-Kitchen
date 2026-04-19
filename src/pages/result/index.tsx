import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState, useMemo, useRef, type CSSProperties } from 'react'
import { DEFAULT_RECIPES } from '../../data/recipes'
import { fetchRecipes, getStoredScene, usesLlmProxy } from '../../api/recipe'
import {
  getFavoriteIds,
  toggleFavorite,
  generateCacheKey,
  getCachedRecipe,
  setCachedRecipe,
  removeCachedRecipe,
} from '../../store/storageUtils'
import { matchRecipesSimple } from '../../utils/recipeMatch'
import { shuffleWithSeed, daySeed } from '../../utils/shuffleSeed'
import { D } from '../../theme/designTokens'
import { STORAGE_KEYS } from '../../store/storageKeys'
import { enrichRecipeMedia } from '../../utils/enrichRecipeMedia'
import { SkeletonRecipeList } from '../../components/Skeleton'
import type { Recipe, SceneType } from '../../types/recipe'

function parseScene(s: string | undefined): SceneType {
  if (s === 'runner' || s === 'quick' || s === 'muscle' || s === 'normal') return s
  return getStoredScene()
}

function hasUsableLlm(): boolean {
  return usesLlmProxy()
}

type ErrorNotice = {
  tone: 'info' | 'warn'
  title: string
  detail: string
}

function buildErrorNotice(raw: string | undefined, hasIngredientMatch: boolean): ErrorNotice {
  if (!raw || hasIngredientMatch) {
    return {
      tone: 'info',
      title: '已为你匹配本地菜谱',
      detail: '联网推荐不可用时的备选内容，质量稳妥。',
    }
  }
  if (raw.includes('超时') || raw.includes('网络')) {
    return { tone: 'warn', title: '网络不稳定', detail: '先展示本地菜谱，稍后可重试 AI。' }
  }
  if (raw.includes('频繁')) {
    return { tone: 'warn', title: '请求过于频繁', detail: '稍等一下再试，先看看本地推荐。' }
  }
  return { tone: 'info', title: '本地推荐', detail: 'AI 暂不可用，已展示本地匹配菜谱。' }
}

export default function Result() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [notice, setNotice] = useState<ErrorNotice | null>(null)
  const [reloadTick, setReloadTick] = useState(0)
  const skipCacheOnceRef = useRef(false)
  const router = useRouter()

  const checkFavorite = (recipeId: number | string): boolean => {
    return getFavoriteIds().includes(String(recipeId))
  }

  useEffect(() => {
    let cancelled = false

    setIsLoading(false)
    setNotice(null)

    const safeSetLoading = (v: boolean) => {
      if (cancelled) return
      setIsLoading(v)
    }

    const fetchAI = async (ingredients: string[], scene: SceneType, bypassCache: boolean) => {
      if (cancelled) return
      safeSetLoading(true)

      const cacheKey = generateCacheKey(ingredients, scene)
      const cached = !bypassCache ? (getCachedRecipe(cacheKey) as Recipe[] | null) : null
      if (cached) {
        if (cancelled) return
        setRecipes(
          cached.map((r) => ({
            ...r,
            source: 'cache' as const,
            isFavorite: checkFavorite(r.id),
          }))
        )
        safeSetLoading(false)
        return
      }

      try {
        const data = await fetchRecipes(ingredients, 3, { scene })
        if (cancelled) return
        setCachedRecipe(cacheKey, data)
        setRecipes(
          data.map((r) => ({
            ...r,
            source: 'ai' as const,
            isFavorite: checkFavorite(r.id),
          }))
        )
      } catch (err: any) {
        if (cancelled) return
        console.error('AI Error:', err)
        const localMatched = matchRecipesSimple(ingredients, 6)
        setNotice(buildErrorNotice(err?.message, localMatched.length > 0))
        const fallback =
          localMatched.length > 0
            ? localMatched
            : shuffleWithSeed([...DEFAULT_RECIPES], daySeed()).slice(0, 6)
        setRecipes(
          fallback.map((r) => ({
            ...r,
            source: 'local' as const,
            isFavorite: checkFavorite(r.id),
          }))
        )
      } finally {
        safeSetLoading(false)
      }
    }

    const { auto, ingredients, from, id: presetId, scene: sceneParam } = router.params
    const decodedIngredients = ingredients ? decodeURIComponent(ingredients) : ''
    const scene = parseScene(sceneParam)

    if (from === 'pantry' && decodedIngredients) {
      const list = decodedIngredients.split(/[,、]/).filter(Boolean)
      const matched = matchRecipesSimple(list, 6)
      if (cancelled) return
      if (matched.length > 0) {
        setRecipes(
          matched.map((r) => ({
            ...r,
            source: 'local' as const,
            isFavorite: checkFavorite(r.id),
          }))
        )
      } else {
        setNotice({
          tone: 'info',
          title: '本地库没有直接匹配',
          detail: '正在请 AI 帮你搭配…',
        })
        void fetchAI(list, scene, false)
      }
    } else if ((from === 'ai' || auto === 'true') && decodedIngredients) {
      const skip = skipCacheOnceRef.current
      skipCacheOnceRef.current = false
      const list = decodedIngredients.split(/[,、]/).filter(Boolean)
      if (!hasUsableLlm()) {
        const localMatched = matchRecipesSimple(list, 6)
        if (cancelled) return
        setNotice(buildErrorNotice('LLM unavailable', localMatched.length > 0))
        setRecipes(
          (localMatched.length > 0
            ? localMatched
            : shuffleWithSeed([...DEFAULT_RECIPES], daySeed()).slice(0, 6)
          ).map((r) => ({
            ...r,
            source: 'local' as const,
            isFavorite: checkFavorite(r.id),
          }))
        )
      } else {
        void fetchAI(list, scene, skip)
      }
    } else if (from === 'random') {
      if (cancelled) return
      const shuffled = shuffleWithSeed([...DEFAULT_RECIPES], daySeed()).slice(0, 6)
      setRecipes(
        shuffled.map((r) => ({
          ...r,
          source: 'local' as const,
          isFavorite: checkFavorite(r.id),
        }))
      )
    } else if (from === 'preset' && presetId) {
      if (cancelled) return
      const recipe = DEFAULT_RECIPES.find((r) => String(r.id) === String(presetId))
      if (recipe) {
        setRecipes([
          {
            ...recipe,
            source: 'local' as const,
            isFavorite: checkFavorite(recipe.id),
          },
        ])
      } else {
        setNotice({ tone: 'warn', title: '未找到该菜谱', detail: '返回首页再试试别的' })
        setRecipes([])
      }
    } else {
      if (cancelled) return
      const shuffled = shuffleWithSeed([...DEFAULT_RECIPES], daySeed()).slice(0, 6)
      setRecipes(
        shuffled.map((r) => ({
          ...r,
          source: 'local' as const,
          isFavorite: checkFavorite(r.id),
        }))
      )
    }

    return () => {
      cancelled = true
    }
  }, [router.params, reloadTick])

  const handleToggleFavorite = (recipe: Recipe) => {
    if (!recipe.id) return
    const isFav = toggleFavorite(recipe)
    setRecipes((prev) =>
      prev.map((r) => (String(r.id) === String(recipe.id) ? { ...r, isFavorite: isFav } : r))
    )
    Taro.showToast({
      title: isFav ? '已收藏' : '已取消',
      icon: 'none',
    })
  }

  const goToDetail = (item: Recipe) => {
    Taro.setStorageSync(STORAGE_KEYS.selectedRecipeDetail, item)
    Taro.navigateTo({ url: '/pages/detail/index' })
  }

  const aiIngredientsList = router.params.ingredients
    ? decodeURIComponent(router.params.ingredients).split(/[,、]/).filter(Boolean)
    : []
  const aiScene = parseScene(router.params.scene)
  const showAiRegen =
    (router.params.from === 'ai' || router.params.auto === 'true') &&
    aiIngredientsList.length > 0

  const handleRegenerateAi = () => {
    const key = generateCacheKey(aiIngredientsList, aiScene)
    removeCachedRecipe(key)
    skipCacheOnceRef.current = true
    setReloadTick((t) => t + 1)
    Taro.showToast({ title: '重新为你生成', icon: 'none' })
  }

  const headerSubtitle = useMemo(() => {
    if (!recipes.length) return ''
    if (router.params.from === 'ai' || router.params.auto === 'true') {
      return `${recipes.length} 道 · 基于你给的食材由 AI 搭配`
    }
    if (router.params.from === 'pantry') {
      return `${recipes.length} 道 · 根据你选的食材匹配`
    }
    return `${recipes.length} 道 · 家常精选`
  }, [recipes.length, router.params])

  const S = useMemo(
    () => ({
      page: {
        minHeight: '100vh',
        backgroundColor: D.bg,
        padding: `${D.pagePadTop}px ${D.pagePadH}px 40px`,
      } as CSSProperties,
      header: { marginBottom: 20 } as CSSProperties,
      title: {
        fontSize: D.titleLarge,
        fontWeight: D.weightBold,
        color: D.label,
        marginBottom: 6,
        letterSpacing: '-0.04em',
      } as CSSProperties,
      subtitle: { fontSize: D.footnote, color: D.labelSecondary } as CSSProperties,
      regenBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 14,
        padding: '6px 12px',
        borderRadius: 999,
        backgroundColor: D.accentMuted,
        color: D.accent,
        fontSize: D.caption,
        fontWeight: D.weightSemibold,
      } as CSSProperties,
      notice: (tone: 'info' | 'warn'): CSSProperties => ({
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: tone === 'warn' ? D.errorBg : D.accentMuted,
        borderRadius: D.radiusM,
        padding: '12px 14px',
        marginBottom: 16,
        borderLeft: `3px solid ${tone === 'warn' ? D.errorAccent : D.accent}`,
      }),
      noticeTitle: (tone: 'info' | 'warn'): CSSProperties => ({
        fontSize: D.footnote,
        fontWeight: D.weightSemibold,
        color: tone === 'warn' ? D.errorFg : D.accent,
        marginBottom: 2,
      }),
      noticeDetail: {
        fontSize: D.caption,
        color: D.labelSecondary,
        lineHeight: 1.5,
      } as CSSProperties,
      listContainer: { display: 'flex', flexDirection: 'column', gap: 12 } as CSSProperties,
      card: {
        backgroundColor: D.bgElevated,
        borderRadius: D.radiusL,
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        border: `0.5px solid ${D.separatorLight}`,
        boxShadow: D.shadowCard,
      } as CSSProperties,
      imgBox: {
        width: 92,
        height: 92,
        backgroundColor: D.bg,
        borderRadius: D.radiusM,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 34,
        flexShrink: 0,
        overflow: 'hidden',
      } as CSSProperties,
      infoBox: { flex: 1, minWidth: 0 } as CSSProperties,
      cardTitle: {
        fontSize: D.body,
        fontWeight: D.weightSemibold,
        color: D.label,
        marginBottom: 4,
        letterSpacing: '-0.01em',
      } as CSSProperties,
      quote: {
        fontSize: D.caption,
        color: D.labelSecondary,
        marginBottom: 8,
        lineHeight: 1.5,
      } as CSSProperties,
      metaRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap' as const,
      } as CSSProperties,
      metaText: {
        fontSize: D.caption,
        color: D.labelTertiary,
      } as CSSProperties,
      metaDot: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: D.labelTertiary,
        opacity: 0.5,
      } as CSSProperties,
      favBtn: {
        padding: 10,
        fontSize: 22,
        backgroundColor: 'transparent',
        border: 'none',
        lineHeight: 1,
      } as CSSProperties,
    }),
    []
  )

  return (
    <View style={S.page}>
      <View style={S.header}>
        <Text style={S.title}>推荐</Text>
        {headerSubtitle ? <Text style={S.subtitle}>{headerSubtitle}</Text> : null}
        {showAiRegen && !isLoading ? (
          <View className="tap-scale" style={S.regenBtn} onClick={handleRegenerateAi}>
            <Text>↻</Text>
            <Text>换个思路</Text>
          </View>
        ) : null}
      </View>

      {notice ? (
        <View style={S.notice(notice.tone)}>
          <Text style={{ fontSize: 16, lineHeight: 1.2, marginTop: 1 }}>
            {notice.tone === 'warn' ? '⚠️' : '✦'}
          </Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={S.noticeTitle(notice.tone)}>{notice.title}</Text>
            <Text style={S.noticeDetail}>{notice.detail}</Text>
          </View>
        </View>
      ) : null}

      {isLoading ? (
        <SkeletonRecipeList count={4} />
      ) : (
        <View style={S.listContainer}>
          {recipes.map((item, idx) => {
            const r = enrichRecipeMedia(item)
            const metaParts: string[] = []
            if (r.time) metaParts.push(`${r.time} 分钟`)
            if (r.difficulty) metaParts.push(r.difficulty)
            return (
              <View
                key={r.id || idx}
                className="tap-scale"
                style={S.card}
                onClick={() => goToDetail(r)}
              >
                <View style={S.imgBox}>
                  {r.image ? (
                    <Image
                      src={r.image}
                      mode="aspectFill"
                      style={{ width: '100%', height: '100%', display: 'block' }}
                      lazyLoad
                    />
                  ) : (
                    <Text>{r.emoji || '🥘'}</Text>
                  )}
                </View>
                <View style={S.infoBox}>
                  <Text style={S.cardTitle}>{r.title}</Text>
                  {r.quote ? (
                    <Text style={S.quote} numberOfLines={2}>
                      {r.quote}
                    </Text>
                  ) : null}
                  {metaParts.length > 0 ? (
                    <View style={S.metaRow}>
                      {metaParts.map((part, i) => (
                        <View
                          key={i}
                          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                          {i > 0 ? <View style={S.metaDot} /> : null}
                          <Text style={S.metaText}>{part}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
                <View
                  style={S.favBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleFavorite(r)
                  }}
                >
                  <Text style={{ color: r.isFavorite ? D.accentWarm : D.labelTertiary }}>
                    {r.isFavorite ? '♥' : '♡'}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}
