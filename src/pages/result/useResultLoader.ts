import { useEffect, useState, type MutableRefObject } from 'react'
import { getCatalogRecipes } from '../../data/recipeRegistry'
import { fetchRecipes, fetchRecipeByDishName } from '../../api/recipe'
import {
  getFavoriteIds,
  generateCacheKey,
  getCachedRecipe,
  setCachedRecipe,
} from '../../store/storageUtils'
import { matchRecipesSimple, matchRecipesWithFallbackSignal } from '../../utils/recipeMatch'
import { filterRecipesByUserIngredients } from '../../utils/recipeIngredientFilter'
import { searchRecipesByTitle } from '../../utils/recipeSearch'
import { shuffleWithSeed, daySeed } from '../../utils/shuffleSeed'
import { trackEvent } from '../../utils/analytics'
import { decodeMealShare } from '../../utils/shareLinks'
import { buildMealPlansWithAiFallback, buildMealPlansResilient } from '../../utils/mealPlanBuilder'
import type { MealConstraint, MealPlan } from '../../types/mealPlan'
import type { Recipe, SceneType } from '../../types/recipe'
import { parseScene, hasUsableLlm, buildSharedMealPlans, type ErrorNotice } from './resultUtils'

function checkFavorite(recipeId: number | string): boolean {
  return getFavoriteIds().includes(String(recipeId))
}

export type ResultLoaderParams = Record<string, string | undefined>

export function useResultLoader(
  params: ResultLoaderParams,
  reloadTick: number,
  skipCacheOnceRef: MutableRefObject<boolean>
) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [notice, setNotice] = useState<ErrorNotice | null>(null)
  const [missDishName, setMissDishName] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const cleanup = () => {
      cancelled = true
    }

    setIsLoading(false)
    setNotice(null)
    setMissDishName(null)
    setMealPlans([])
    setSelectedPlanIndex(0)

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
      const cached = cachedRaw ? filterRecipesByUserIngredients(cachedRaw, ingredients) : null

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
      } catch (err: unknown) {
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

    const fetchDishAi = async (dishName: string, scene: SceneType) => {
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

    const { auto, ingredients, from, id: presetId, scene: sceneParam, dish: dishParam } = params
    const decodedIngredients = ingredients ? decodeURIComponent(ingredients) : ''
    const scene = parseScene(sceneParam)
    trackEvent('result_view', {
      from: from || (auto === 'true' ? 'auto' : 'unknown'),
      hasIngredients: Boolean(decodedIngredients),
      hasDish: Boolean(dishParam),
      scene,
    })

    if (from === 'meal') {
      const sharedPlan = params.plan ? decodeMealShare(params.plan) : null
      if (sharedPlan) {
        trackEvent('share_open', { kind: 'meal', count: sharedPlan.recipeIds.length })
        const plans = buildSharedMealPlans(sharedPlan.recipeIds)
        if (cancelled) return
        setMealPlans(plans)
        setRecipes([])
        setNotice(
          plans.length
            ? { tone: 'info', title: '朋友分享的方案', detail: plans[0].reason }
            : {
                tone: 'warn',
                title: '分享的菜谱找不到了',
                detail: '可能尚未加载 catalog，稍后再试或自己选食材。',
              }
        )
        return cleanup
      }

      const list = decodedIngredients ? decodedIngredients.split(/[,、]/).filter(Boolean) : []
      const expiringRaw = params.expiring ?? ''
      const expiringList = expiringRaw
        ? decodeURIComponent(expiringRaw).split(',').filter(Boolean)
        : list
      const constraintsRaw = params.constraints ?? ''
      const constraints = constraintsRaw
        ? (decodeURIComponent(constraintsRaw).split(',') as MealConstraint[])
        : []
      const servings = Number(params.servings) || 3
      const fromReminder = params.source === 'reminder'
      const buildOpts = {
        pantryNames: list,
        expiringNames: expiringList,
        constraints,
        servings,
        limit: 3,
      }

      if (fromReminder) {
        // 临期召回场景保留「诚实空态」：空结果时展示延长保存/标记用完/加入待买的操作条
        void buildMealPlansWithAiFallback(buildOpts).then((plans) => {
          if (cancelled) return
          trackEvent('meal_plan_view', { count: plans.length, source: 'reminder' })
          setMealPlans(plans)
          setRecipes([])
          setNotice(
            plans.length === 0
              ? {
                  tone: 'warn',
                  title: '临期食材暂无搭配方案',
                  detail: '建议尽快清掉、延长保存，或加入待买后再做。',
                }
              : // 方案正常时不再弹提示条：它说的「优先消耗临期 xxx」与下方
                // 「为什么推荐这些」卡片完全重复，属于同一句话说两遍
                null
          )
        })
        return cleanup
      }

      void buildMealPlansResilient(buildOpts).then(({ plans, degraded }) => {
        if (cancelled) return
        trackEvent('meal_plan_view', {
          count: plans.length,
          source: params.source ?? 'unknown',
          degraded,
        })
        setMealPlans(plans)
        setRecipes([])
        if (plans.length === 0) {
          // 仅在 catalog 尚未加载等极端情况才会走到
          setNotice({
            tone: 'warn',
            title: '菜谱库还没准备好',
            detail: '请检查网络后下拉重试。',
          })
        } else if (degraded === 'relaxed') {
          setNotice({
            tone: 'info',
            title: '放宽筛选后拼出了方案',
            detail: '严格满足全部筛选时没有完整组合，先按最接近的搭配给你。',
          })
        } else if (degraded === 'generic') {
          setNotice({
            tone: 'info',
            title: list.length > 0 ? '换个思路：先来三套家常搭配' : '这一顿的方案',
            detail:
              list.length > 0
                ? '你选的食材暂时拼不出完整一餐，这三套是家常稳妥组合；也可以减少食材种类再试。'
                : plans[0].reason,
          })
        } else {
          // 成功方案的依据由 MealPlanReasonBar 一句话说完，不再叠一张色块卡
          setNotice(null)
        }
      })
      return cleanup
    }

    if (from === 'pantry' && decodedIngredients) {
      const list = decodedIngredients.split(/[,、]/).filter(Boolean)
      const expiringRaw = params.expiring ?? ''
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
        return cleanup
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
          void fetchDishAi(dishName, scene)
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

    return cleanup
  }, [params, reloadTick, skipCacheOnceRef])

  return {
    recipes,
    setRecipes,
    mealPlans,
    selectedPlanIndex,
    setSelectedPlanIndex,
    isLoading,
    setIsLoading,
    notice,
    setNotice,
    missDishName,
    setMissDishName,
  }
}
