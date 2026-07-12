import { View, Text } from '@tarojs/components'
import Taro, { useRouter, useShareAppMessage } from '@tarojs/taro'
import { useMemo, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { resolveFullRecipe } from '../../data/recipeRegistry'
import { fetchRecipeByDishName } from '../../api/recipe'
import {
  getFavoriteIds,
  toggleFavorite,
  generateCacheKey,
  removeCachedRecipe,
} from '../../store/storageUtils'
import { addRecipeWish, saveCustomRecipe } from '../../store/customRecipes'
import { enrichRecipeMedia } from '../../utils/enrichRecipeMedia'
import { SkeletonRecipeList } from '../../components/Skeleton'
import { AppIcon } from '../../components/AppIcon'
import { decodeMealShare, primeMealShare, resolvePrimedShare } from '../../utils/shareLinks'
import { MealPlanCard } from './components/MealPlanCard'
import { MealPlanActions } from './components/MealPlanActions'
import { RecipeResultCard } from './components/RecipeResultCard'
import type { MealConstraint, MealPlan } from '../../types/mealPlan'
import { setSelectedRecipeForDetail } from '../../utils/navigationPayload'
import { ResultPageHeader } from './components/ResultPageHeader'
import { ResultNoticeBar } from './components/ResultNoticeBar'
import { ReminderMealEmptyBar } from './components/ReminderMealEmptyBar'
import { MealPlanReasonBar } from './components/MealPlanReasonBar'
import { MissDishPanel } from './components/MissDishPanel'
import { householdStore } from '../../store/householdStore'
import { usePantryStore } from '../../store/context'
import { getRecipePantryContext } from '../../utils/recipePantryContext'
import type { Recipe } from '../../types/recipe'
import { parseScene, hasUsableLlm } from './resultUtils'
import { resultPageStyles as S } from './resultPageStyles'
import { D } from '../../theme/designTokens'
import { useResultLoader } from './useResultLoader'

function Result() {
  const pantryStore = usePantryStore()
  const [reloadTick, setReloadTick] = useState(0)
  const [failedImages, setFailedImages] = useState<Record<string, true>>({})
  const [mainCtaLoading, setMainCtaLoading] = useState(false)
  const skipCacheOnceRef = useRef(false)
  const router = useRouter()

  const {
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
  } = useResultLoader(router.params, reloadTick, skipCacheOnceRef)

  useShareAppMessage(() =>
    resolvePrimedShare({
      title: '爱心厨房 - 今晚吃什么？',
      path: '/pages/result/index?from=meal',
    })
  )

  const checkFavorite = (recipeId: number | string): boolean => {
    return getFavoriteIds().includes(String(recipeId))
  }

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
    Taro.showLoading({ title: '打开菜谱…', mask: true })
    try {
      const full = await resolveFullRecipe(item)
      setSelectedRecipeForDetail(full)
      await Taro.navigateTo({ url: '/pages/detail/index' })
    } catch {
      Taro.showToast({ title: '暂时打不开这道菜', icon: 'none' })
    } finally {
      Taro.hideLoading()
    }
  }

  const handleStartMain = async (main: Recipe) => {
    if (mainCtaLoading) return
    setMainCtaLoading(true)
    try {
      await goToDetail(main)
    } finally {
      setMainCtaLoading(false)
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
      Taro.showToast({ title: '智能推荐服务未就绪', icon: 'none' })
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
        detail: '做法已备好，可保存到「我的菜谱」，下次一键再做。',
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

  const isMealMode = router.params.from === 'meal'
  const expiringForMeal = router.params.expiring
    ? decodeURIComponent(router.params.expiring).split(',').filter(Boolean)
    : []

  const mealTitle = useMemo(() => {
    if (!isMealMode) return '推荐'
    if (expiringForMeal.length > 0) return '今晚先吃掉这些'
    return '今晚吃什么'
  }, [isMealMode, expiringForMeal.length])

  const mealConstraints = useMemo(() => {
    const raw = router.params.constraints ?? ''
    return raw ? (decodeURIComponent(raw).split(',') as MealConstraint[]) : []
  }, [router.params.constraints])

  const toggleMealConstraint = (c: MealConstraint) => {
    const next = mealConstraints.includes(c)
      ? mealConstraints.filter((x) => x !== c)
      : [...mealConstraints, c]
    const parts = [`from=meal`]
    if (router.params.ingredients) {
      parts.push(`ingredients=${router.params.ingredients}`)
    }
    if (router.params.expiring) {
      parts.push(`expiring=${router.params.expiring}`)
    }
    if (next.length) {
      parts.push(`constraints=${encodeURIComponent(next.join(','))}`)
    }
    if (router.params.source) {
      parts.push(`source=${router.params.source}`)
    }
    Taro.redirectTo({ url: `/pages/result/index?${parts.join('&')}` })
  }

  const handleAddMealShopping = (plan: MealPlan) => {
    if (plan.missingItems.length === 0) {
      Taro.showToast({ title: '不缺东西', icon: 'none' })
      return
    }
    householdStore.addShoppingItems(plan.missingItems)
    Taro.showToast({
      title: `已加 ${plan.missingItems.length} 样到采购清单`,
      icon: 'success',
    })
  }

  const headerSubtitle = useMemo(() => {
    if (isMealMode) {
      if (mealPlans.length === 0) return ''
      return `${mealPlans.length} 个方案 · 一顿饭搭配`
    }
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
  }, [recipes.length, router.params, missDishName, isMealMode, mealPlans.length])

  const activeMealPlan = mealPlans[selectedPlanIndex] ?? null

  return (
    <View style={S.page}>
      <ResultPageHeader
        title={mealTitle}
        subtitle={headerSubtitle}
        isMealMode={isMealMode}
        mealConstraints={mealConstraints}
        showAiRegen={showAiRegen}
        isLoading={isLoading}
        onToggleConstraint={toggleMealConstraint}
        onRegenerateAi={handleRegenerateAi}
      />

      {notice ? <ResultNoticeBar notice={notice} /> : null}

      {isMealMode && mealPlans.length === 0 && router.params.source === 'reminder' && !isLoading ? (
        <ReminderMealEmptyBar expiringNames={expiringForMeal} />
      ) : null}

      {!isLoading && missDishName ? (
        <MissDishPanel
          dishName={missDishName}
          onGenerateWithAi={handleGenerateMissDish}
          onAddWish={handleAddWish}
        />
      ) : null}

      {isLoading ? (
        <SkeletonRecipeList count={4} />
      ) : isMealMode ? (
        <View>
          {activeMealPlan ? (
            <MealPlanReasonBar plan={activeMealPlan} expiringNames={expiringForMeal} />
          ) : null}
          {mealPlans.map((plan, idx) => (
            <MealPlanCard
              key={plan.id}
              plan={plan}
              selected={idx === selectedPlanIndex}
              onSelect={() => setSelectedPlanIndex(idx)}
              onOpenRecipe={(r) => void goToDetail(r)}
              onAddShopping={() => handleAddMealShopping(plan)}
            />
          ))}
          {activeMealPlan ? (
            <MealPlanActions
              plan={activeMealPlan}
              loading={mainCtaLoading}
              disabled={mainCtaLoading}
              onStartMain={() => {
                const main = activeMealPlan.recipes.find((s) => s.role === 'main')?.recipe
                if (main) void handleStartMain(main)
              }}
              onShare={() => primeMealShare(activeMealPlan, router.params.ingredients)}
            />
          ) : null}
        </View>
      ) : (
        <View style={S.listContainer}>
          {recipes.map((item, idx) => {
            const r = enrichRecipeMedia(item)
            const imageKey = String(r.id || idx)
            let pantryHint: string | undefined
            if (pantryStore.totalCount > 0 && r.ingredients?.length) {
              const ctx = getRecipePantryContext(r, pantryStore.items)
              if (ctx.hits.length > 0) pantryHint = ctx.reason
            }
            return (
              <RecipeResultCard
                key={r.id || idx}
                recipe={r}
                imageKey={imageKey}
                pantryHint={pantryHint}
                imageFailed={Boolean(failedImages[imageKey])}
                onOpen={() => goToDetail(r)}
                onToggleFavorite={() => handleToggleFavorite(r)}
                onImageError={() => {
                  console.warn('recipe image load failed', r.title, r.image)
                  setFailedImages((prev) => ({ ...prev, [imageKey]: true }))
                }}
              />
            )
          })}
          {!isLoading && recipes.some((r) => r.source === 'ai' || r.source === 'cache') ? (
            <View
              className="tap-scale"
              style={{ ...S.regenBtn, alignSelf: 'flex-start', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={() => handleSaveCustom(recipes[0])}
            >
              <AppIcon name="add" size={14} color="#fff" backgroundColor={D.accent} />
              <Text>保存到「我的菜谱」</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  )
}

export default observer(Result)
