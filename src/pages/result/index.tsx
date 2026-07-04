import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState, useMemo, useRef, type CSSProperties } from 'react'
import { getCatalogRecipes, resolveFullRecipe } from '../../data/recipeRegistry'
import { fetchRecipes, fetchRecipeByDishName, getStoredScene, usesLlmProxy } from '../../api/recipe'
import {
  getFavoriteIds,
  toggleFavorite,
  generateCacheKey,
  getCachedRecipe,
  setCachedRecipe,
  removeCachedRecipe,
} from '../../store/storageUtils'
import { matchRecipesSimple, matchRecipesWithFallbackSignal } from '../../utils/recipeMatch'
import { filterRecipesByUserIngredients } from '../../utils/recipeIngredientFilter'
import { searchRecipesByTitle } from '../../utils/recipeSearch'
import { addRecipeWish, saveCustomRecipe } from '../../store/customRecipes'
import { shuffleWithSeed, daySeed } from '../../utils/shuffleSeed'
import { D } from '../../theme/designTokens'
import { STORAGE_KEYS } from '../../store/storageKeys'
import { enrichRecipeMedia } from '../../utils/enrichRecipeMedia'
import { SkeletonRecipeList } from '../../components/Skeleton'
import { trackEvent } from '../../utils/analytics'
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
  const [failedImages, setFailedImages] = useState<Record<string, true>>({})
  const [missDishName, setMissDishName] = useState<string | null>(null)
  const skipCacheOnceRef = useRef(false)
  const router = useRouter()

  const checkFavorite = (recipeId: number | string): boolean => {
    return getFavoriteIds().includes(String(recipeId))
  }

  useEffect(() => {
    let cancelled = false

    setIsLoading(false)
    setNotice(null)
    setMissDishName(null)

    const safeSetLoading = (v: boolean) => {
      if (cancelled) return
      setIsLoading(v)
    }

    const fetchAI = async (
      ingredients: string[],
      scene: SceneType,
      bypassCache: boolean,
      localBase: Recipe[] = []
    ) => {
      if (cancelled) return
      safeSetLoading(true)

      const cacheKey = generateCacheKey(ingredients, scene)
      const cachedRaw = !bypassCache ? (getCachedRecipe(cacheKey) as Recipe[] | null) : null
      const cached = cachedRaw
        ? filterRecipesByUserIngredients(cachedRaw, ingredients)
        : null

      const mergeWithLocal = (aiList: Recipe[]) => {
        const seen = new Set(localBase.map((r) => r.title.trim()))
        const extra = aiList.filter((r) => !seen.has(r.title.trim()))
        return [...localBase, ...extra].slice(0, 6)
      }

      if (cached && cached.length > 0) {
        if (cancelled) return
        trackEvent('result_loaded', { source: 'cache', count: mergeWithLocal(cached).length })
        setRecipes(
          mergeWithLocal(cached).map((r) => ({
            ...r,
            source: r.source ?? ('cache' as const),
            isFavorite: checkFavorite(r.id),
          }))
        )
        setNotice({
          tone: 'info',
          title: localBase.length > 0 ? '已补充 AI 推荐' : 'AI 推荐',
          detail: '均围绕你选的食材搭配，可点「换一批」重新生成。',
        })
        safeSetLoading(false)
        return
      }

      try {
        const data = await fetchRecipes(ingredients, 3, { scene, strictIngredients: true })
        if (cancelled) return
        setCachedRecipe(cacheKey, data)
        trackEvent('result_loaded', { source: 'ai', count: mergeWithLocal(data).length })
        setRecipes(
          mergeWithLocal(data).map((r) => ({
            ...r,
            source: 'ai' as const,
            isFavorite: checkFavorite(r.id),
          }))
        )
        setNotice({
          tone: 'info',
          title: localBase.length > 0 ? '已补充 AI 推荐' : 'AI 已按食材搭配',
          detail: '每道菜都用了你选的食材，可收藏或查看详情。',
        })
      } catch (err: any) {
        if (cancelled) return
        console.error('AI Error:', err)
        const localMatched = matchRecipesSimple(ingredients, 6)
        const combined = localBase.length > 0 ? localBase : localMatched
        if (combined.length > 0) {
          trackEvent('result_fallback', { reason: 'ai_error', count: combined.length })
          setNotice({
            tone: 'warn',
            title: 'AI 暂不可用',
            detail: '已展示本地库中与你食材相关的菜谱。',
          })
          setRecipes(
            combined.map((r) => ({
              ...r,
              source: 'local' as const,
              isFavorite: checkFavorite(r.id),
            }))
          )
        } else {
          trackEvent('result_empty', { reason: 'ai_error' })
          setNotice({
            tone: 'warn',
            title: '暂无合适搭配',
            detail:
              (err as { message?: string })?.message ||
              '本地库与 AI 都没有找到符合所选食材的菜，试试减少或更换食材。',
          })
          setRecipes([])
        }
      } finally {
        safeSetLoading(false)
      }
    }

    const fetchDishAi = async (dishName: string) => {
      if (cancelled) return
      safeSetLoading(true)
      try {
        const data = await fetchRecipeByDishName(dishName, { scene })
        if (cancelled) return
        trackEvent('result_loaded', { source: 'dish_ai', count: data.length })
        setRecipes(
          data.map((r) => ({
            ...r,
            source: 'ai' as const,
            isFavorite: checkFavorite(r.id),
          }))
        )
        setNotice({
          tone: 'info',
          title: `AI 已生成「${dishName}」`,
          detail: '可收藏或保存到「我的菜谱」；正式收录后可从下厨房导入真实图文。',
        })
        setMissDishName(dishName)
      } catch (err: unknown) {
        if (cancelled) return
        const msg = (err as { message?: string })?.message || '生成失败'
        trackEvent('result_empty', { reason: 'dish_ai_error' })
        setNotice({ tone: 'warn', title: 'AI 生成失败', detail: msg })
        setRecipes([])
        setMissDishName(dishName)
      } finally {
        safeSetLoading(false)
      }
    }

    const { auto, ingredients, from, id: presetId, scene: sceneParam, dish: dishParam } = router.params
    const decodedIngredients = ingredients ? decodeURIComponent(ingredients) : ''
    const scene = parseScene(sceneParam)
    trackEvent('result_view', {
      from: from || (auto === 'true' ? 'auto' : 'unknown'),
      hasIngredients: Boolean(decodedIngredients),
      hasDish: Boolean(dishParam),
      scene,
    })

    if (from === 'pantry' && decodedIngredients) {
      const list = decodedIngredients.split(/[,、]/).filter(Boolean)
      // 临期食材从 URL 参数中读取（选菜页会附带 expiring 参数）
      const expiringRaw = router.params.expiring ?? ''
      const expiringList = expiringRaw ? decodeURIComponent(expiringRaw).split(',').filter(Boolean) : []
      const { recipes: matched, needsAI } = matchRecipesWithFallbackSignal(list, {
        limit: 6,
        expiringIngredients: expiringList,
        aiTriggerThreshold: 3,
      })
      if (cancelled) return
      if (matched.length > 0) {
        setRecipes(
          matched.map((r) => ({
            ...r,
            source: 'local' as const,
            isFavorite: checkFavorite(r.id),
          }))
        )
        if (needsAI && hasUsableLlm()) {
          // 本地有一些结果但不足 3 条——先展示本地，后台静默请求 AI 补充
          setNotice({
            tone: 'info',
            title: `已找到 ${matched.length} 道本地菜谱`,
            detail: '同时请 AI 为你搜寻更多…',
          })
          void fetchAI(list, scene, false, matched)
        }
      } else {
        setNotice({
          tone: 'info',
          title: '本地库没有直接匹配',
          detail: '正在请 AI 按你选的食材搭配…',
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
        if (localMatched.length > 0) {
          setNotice({
            tone: 'info',
            title: '已为你匹配本地菜谱',
            detail: '联网推荐不可用时的备选，均围绕所选食材。',
          })
        } else {
          setNotice({
            tone: 'warn',
            title: '暂无匹配',
            detail: '本地库找不到符合所选食材的菜，请配置 AI 或调整食材。',
          })
        }
        setRecipes(
          localMatched.map((r) => ({
            ...r,
            source: 'local' as const,
            isFavorite: checkFavorite(r.id),
          }))
        )
      } else {
        void fetchAI(list, scene, skip)
      }
    } else if (from === 'dish' && dishParam) {
      const dishName = decodeURIComponent(dishParam).trim()
      if (!dishName) {
        setRecipes([])
        return
      }
      const hits = searchRecipesByTitle(dishName, 10)
      if (cancelled) return
      if (hits.length > 0) {
        setRecipes(
          hits.map((h) => ({
            ...h.recipe,
            source: (h.recipe.source ?? 'local') as Recipe['source'],
            isFavorite: checkFavorite(h.recipe.id),
          }))
        )
        const top = hits[0]
        setNotice({
          tone: 'info',
          title:
            top.score >= 0.95
              ? `已找到「${top.recipe.title}」`
              : `与「${dishName}」相关的 ${hits.length} 道菜`,
          detail:
            top.score >= 0.95
              ? '来自本地菜谱库'
              : '没有完全同名？可继续用 AI 生成你要的那道',
        })
        if (top.score < 0.95) setMissDishName(dishName)
      } else {
        setRecipes([])
        setMissDishName(dishName)
        if (hasUsableLlm()) {
          setNotice({
            tone: 'info',
            title: `库里还没有「${dishName}」`,
            detail: '正在请 AI 生成菜谱…',
          })
          void fetchDishAi(dishName)
        } else {
          setNotice({
            tone: 'warn',
            title: `库里还没有「${dishName}」`,
            detail: '配置 AI 服务后可即时生成；或先加入心愿菜单等待收录。',
          })
        }
      }
    } else if (from === 'random') {
      if (cancelled) return
      const shuffled = shuffleWithSeed([...getCatalogRecipes()], daySeed()).slice(0, 6)
      setRecipes(
        shuffled.map((r) => ({
          ...r,
          source: 'local' as const,
          isFavorite: checkFavorite(r.id),
        }))
      )
    } else if (from === 'preset' && presetId) {
      if (cancelled) return
      const recipe = getCatalogRecipes().find((r) => String(r.id) === String(presetId))
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
      const shuffled = shuffleWithSeed([...getCatalogRecipes()], daySeed()).slice(0, 6)
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

  const goToDetail = async (item: Recipe) => {
    Taro.showLoading({ title: '加载中', mask: true })
    try {
      const full = await resolveFullRecipe(item)
      Taro.setStorageSync(STORAGE_KEYS.selectedRecipeDetail, full)
      Taro.navigateTo({ url: '/pages/detail/index' })
    } finally {
      Taro.hideLoading()
    }
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

  const handleGenerateMissDish = async () => {
    if (!missDishName) return
    if (!hasUsableLlm()) {
      Taro.showToast({ title: '请先配置 AI 服务', icon: 'none' })
      return
    }
    setIsLoading(true)
    try {
      const data = await fetchRecipeByDishName(missDishName, { scene: aiScene })
      setRecipes(
        data.map((r) => ({
          ...r,
          source: 'ai' as const,
          isFavorite: checkFavorite(r.id),
        }))
      )
      setNotice({
        tone: 'info',
        title: `AI 已生成「${missDishName}」`,
        detail: '可保存到「我的菜谱」；收录进正式库后会补上下厨房真实图文。',
      })
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || '请稍后再试'
      Taro.showToast({ title: msg, icon: 'none' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddWish = () => {
    if (!missDishName) return
    addRecipeWish(missDishName)
    Taro.showToast({ title: '已加入心愿菜', icon: 'success' })
  }

  const handleSaveCustom = (recipe: Recipe) => {
    saveCustomRecipe(recipe)
    Taro.showToast({ title: '已保存到我的菜谱', icon: 'success' })
  }

  const headerSubtitle = useMemo(() => {
    if (!recipes.length && missDishName) return `正在找「${missDishName}」`
    if (!recipes.length) return ''
    if (router.params.from === 'dish') {
      return `${recipes.length} 道 · 菜名搜索`
    }
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

      {!isLoading && missDishName ? (
        <View style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {hasUsableLlm() ? (
            <View className="tap-scale" style={S.regenBtn} onClick={handleGenerateMissDish}>
              <Text>✨</Text>
              <Text>用 AI 生成「{missDishName}」</Text>
            </View>
          ) : null}
          <View
            className="tap-scale"
            style={{
              ...S.regenBtn,
              backgroundColor: D.bgElevated,
              color: D.labelSecondary,
              border: `0.5px solid ${D.separatorLight}`,
            }}
            onClick={handleAddWish}
          >
            <Text>📝</Text>
            <Text>加入心愿菜（优先收录进正式库）</Text>
          </View>
        </View>
      ) : null}

      {isLoading ? (
        <SkeletonRecipeList count={4} />
      ) : (
        <View style={S.listContainer}>
          {recipes.map((item, idx) => {
            const r = enrichRecipeMedia(item)
            const imageKey = String(r.id || idx)
            const imageFailed = failedImages[imageKey]
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
                  {r.image && !imageFailed ? (
                    <Image
                      src={r.image}
                      mode="aspectFill"
                      style={{ width: '100%', height: '100%', display: 'block' }}
                      lazyLoad
                      onError={() => {
                        console.warn('recipe image load failed', r.title, r.image)
                        setFailedImages((prev) => ({ ...prev, [imageKey]: true }))
                      }}
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
          {!isLoading && recipes.some((r) => r.source === 'ai' || r.source === 'cache') ? (
            <View
              className="tap-scale"
              style={{ ...S.regenBtn, alignSelf: 'flex-start', marginTop: 4 }}
              onClick={() => handleSaveCustom(recipes[0])}
            >
              <Text>📥</Text>
              <Text>保存到「我的菜谱」</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  )
}
