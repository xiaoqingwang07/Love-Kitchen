import { View } from '@tarojs/components'
import Taro, { useRouter, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { useState, useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { usePantryStore, useHouseholdStore } from '../../store/context'
import { findPantryItemForRecipeIngredient } from '../../utils/ingredientMatch'
import { D } from '../../theme/designTokens'
import { findRecipeById, resolveFullRecipe } from '../../data/recipeRegistry'
import { enrichRecipeMedia } from '../../utils/enrichRecipeMedia'
import {
  markAsCooked,
  isFavorite as readIsFavorite,
  toggleFavorite,
} from '../../store/storageUtils'
import type { Recipe, Step } from '../../types/recipe'
import { generateShoppingList } from '../../utils/shoppingList'
import { getRecipePantryContext } from '../../utils/recipePantryContext'
import { detectAndSaveNewAchievements, getUserStats } from '../../utils/achievements'
import { useParallelTimers } from '../../hooks/useParallelTimers'
import { ShoppingListSheet } from '../../components/ShoppingListSheet'
import { reportEvent, EVENTS } from '../../utils/analyticsExport'
import { recordMealSolved } from '../../utils/mealSolvedTracker'
import { resolvePrimedShare, getPendingShare } from '../../utils/shareLinks'
import { consumeSelectedRecipeForDetail, setSharedRecipeSnapshot, peekSharedRecipeSnapshot } from '../../utils/navigationPayload'
import { CookingMode } from './components/CookingMode'
import { RecipeHero } from './components/RecipeHero'
import { PantryContextBar } from './components/PantryContextBar'
import { IngredientGrid } from './components/IngredientGrid'
import { RecipeStepsList } from './components/RecipeStepsList'
import { NutritionInsight } from './components/NutritionInsight'
import { DetailBottomBar } from './components/DetailBottomBar'
import { DetailEmptyState } from './components/DetailEmptyState'

const SHARE_PAYLOAD_LIMIT = 1500

function buildSharePayload(recipe: Recipe): string | null {
  const encode = (r: Recipe): string => encodeURIComponent(JSON.stringify(r))
  const fits = (s: string) => s.length <= SHARE_PAYLOAD_LIMIT

  try {
    const ingredients =
      recipe.ingredients?.map((ing) => ({ name: ing.name, amount: ing.amount })) || []

    // 1) 完整 compact：含步骤
    const full: Recipe = {
      id: recipe.id,
      title: recipe.title,
      source: recipe.source,
      quote: recipe.quote,
      emoji: recipe.emoji,
      time: recipe.time,
      difficulty: recipe.difficulty,
      nutritionAnalysis: recipe.nutritionAnalysis,
      ingredients,
      steps:
        recipe.steps?.map((step) => ({
          content: step.content,
          time: step.time,
          tip: step.tip,
        })) || [],
    }
    const fullEnc = encode(full)
    if (fits(fullEnc)) return fullEnc

    // 2) 精简：去掉 tip、营养，步骤正文截断
    const lean: Recipe = {
      id: recipe.id,
      title: recipe.title,
      source: recipe.source,
      quote: recipe.quote,
      emoji: recipe.emoji,
      time: recipe.time,
      difficulty: recipe.difficulty,
      ingredients,
      steps:
        recipe.steps?.map((step) => ({
          content: step.content.length > 60 ? `${step.content.slice(0, 60)}…` : step.content,
          time: step.time,
        })) || [],
    }
    const leanEnc = encode(lean)
    if (fits(leanEnc)) return leanEnc

    // 3) 最小：保证对方至少拿到一张「菜名 + 食材」的真实卡片，可再 AI 补全做法
    const minimal: Recipe = {
      id: recipe.id,
      title: recipe.title,
      source: recipe.source,
      quote: recipe.quote,
      emoji: recipe.emoji,
      time: recipe.time,
      difficulty: recipe.difficulty,
      ingredients,
      steps: [],
    }
    const minEnc = encode(minimal)
    return fits(minEnc) ? minEnc : null
  } catch {
    return null
  }
}

function Detail() {
  const router = useRouter()
  const pantryStore = usePantryStore()
  const householdStore = useHouseholdStore()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [shareMiss, setShareMiss] = useState(false)
  const [isFavState, setIsFavState] = useState(false)
  const [cookingMode, setCookingMode] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showShopping, setShowShopping] = useState(false)
  const [failedImages, setFailedImages] = useState<Record<string, true>>({})

  const timers = useParallelTimers()

  useShareAppMessage(() => {
    const primed = getPendingShare()
    if (primed?.kind === 'shopping') {
      return resolvePrimedShare({
        title: '爱心厨房 - 今天吃什么？',
        path: '/pages/index/index',
      })
    }
    if (!recipe) return { title: '爱心厨房 - 今天吃什么？', path: '/pages/index/index' }
    const payload = buildSharePayload(recipe)
    const shareCtx = getRecipePantryContext(recipe, pantryStore.items)
    try {
      setSharedRecipeSnapshot(recipe)
    } catch (e) {
      console.warn('share snapshot save failed', e)
    }
    reportEvent(EVENTS.shareSend, { kind: 'recipe', missing: shareCtx.missing.length })
    return resolvePrimedShare({
      title: shareCtx.missing.length
        ? `今晚吃【${recipe.title}】· 还缺 ${shareCtx.missing.length} 样`
        : `今晚吃这个 👉【${recipe.title}】`,
      path: payload
        ? `/pages/detail/index?payload=${payload}`
        : `/pages/detail/index?shareId=${recipe.id}`,
      imageUrl: recipe.image || '',
    })
  })

  useShareTimeline(() => {
    if (!recipe) return { title: '爱心厨房 - 今天吃什么？' }
    return {
      title: `${recipe.emoji || '🍽️'} ${recipe.title} | ${recipe.time || 20} 分钟搞定`,
    }
  })

  useEffect(() => {
    let cancelled = false

    async function applyRecipe(raw: Recipe) {
      const resolved = await resolveFullRecipe(raw)
      if (cancelled) return
      const enriched = enrichRecipeMedia(resolved)
      reportEvent('detail_view', {
        source: enriched.source ?? 'local',
        hasSteps: Boolean(enriched.steps?.length),
        ingredientCount: enriched.ingredients?.length || 0,
      })
      setRecipe(enriched)
      setIsFavState(readIsFavorite(enriched.id))
      setShareMiss(false)
    }

    const payload = router.params.payload
    if (payload) {
      try {
        const parsed = JSON.parse(decodeURIComponent(payload)) as Recipe
        void applyRecipe(parsed)
        return () => {
          cancelled = true
        }
      } catch (e) {
        console.warn('share payload parse failed', e)
      }
    }
    const shareId = router.params.shareId
    if (shareId) {
      const preset = findRecipeById(shareId)
      if (preset) {
        void applyRecipe(preset)
        return () => {
          cancelled = true
        }
      }
      try {
        const snap = peekSharedRecipeSnapshot(shareId)
        if (snap) {
          void applyRecipe(snap)
          return () => {
            cancelled = true
          }
        }
      } catch (e) {
        console.warn('share snapshot read failed', e)
      }
      setRecipe(null)
      setShareMiss(true)
      return () => {
        cancelled = true
      }
    }
    setShareMiss(false)
    const data = consumeSelectedRecipeForDetail()
    if (data) {
      void applyRecipe(data)
    } else setRecipe(null)

    return () => {
      cancelled = true
    }
  }, [router.params.shareId, router.params.payload])

  const handleToggleFavorite = () => {
    if (!recipe) return
    const next = toggleFavorite(recipe)
    reportEvent('favorite_toggle', { enabled: next, source: recipe.source ?? 'local' })
    setIsFavState(next)
    Taro.showToast({ title: next ? '已收藏' : '已取消', icon: 'none' })
  }

  const handleStartCooking = () => {
    if (!recipe?.steps || recipe.steps.length === 0) return
    reportEvent(EVENTS.cookStart, {
      source: recipe.source ?? 'local',
      stepCount: recipe.steps.length,
      pantryCount: pantryStore.totalCount,
    })

    const ingredientNames = (recipe.ingredients || []).map((i) => i.name)
    const hasMatchInPantry = ingredientNames.some(
      (name) => !!findPantryItemForRecipeIngredient(pantryStore.items, name)
    )

    if (hasMatchInPantry) {
      Taro.showModal({
        title: '联动冰箱',
        content: '要自动扣减这道菜用掉的食材吗？',
        confirmText: '扣减',
        cancelText: '跳过',
        success: (res) => {
          if (res.confirm) {
            const count = pantryStore.deductItems(ingredientNames)
            if (count > 0) {
              reportEvent(EVENTS.pantryDeduct, { count, source: recipe.source ?? 'local' })
            }
            Taro.showToast({ title: `已扣减 ${count} 项`, icon: 'success' })
          }
          setCookingMode(true)
          setCurrentStep(0)
        },
      })
    } else {
      setCookingMode(true)
      setCurrentStep(0)
    }
  }

  const exitCookingMode = () => {
    setCookingMode(false)
    setCurrentStep(0)
  }

  const handleMarkCooked = () => {
    if (!recipe) return
    const ok = markAsCooked(recipe)
    if (ok) {
      reportEvent(EVENTS.cookComplete, { source: recipe.source ?? 'local' })
      const stats = getUserStats(pantryStore.items)
      const newAchievements = detectAndSaveNewAchievements(stats)
      if (newAchievements.length > 0) {
        const top = newAchievements[0]
        Taro.showToast({
          title: `解锁成就：${top.emoji} ${top.title}`,
          icon: 'none',
          duration: 2500,
        })
      } else {
        Taro.showToast({ title: '已记入做过的菜', icon: 'success' })
      }
    }
  }

  const shoppingListItems = useMemo(() => {
    if (!recipe?.ingredients) return []
    return generateShoppingList(recipe.ingredients, pantryStore.items)
  }, [recipe, pantryStore.items])

  const pantryContext = useMemo(() => {
    if (!recipe) return null
    return getRecipePantryContext(recipe, pantryStore.items)
  }, [recipe, pantryStore.items])

  if (cookingMode && recipe?.steps) {
    return (
      <CookingMode
        recipe={recipe}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onExit={exitCookingMode}
        onComplete={() => {
          Taro.showToast({ title: '完工！', icon: 'success' })
          recordMealSolved({ recipeId: String(recipe.id), title: recipe.title })
          handleMarkCooked()
          exitCookingMode()
        }}
        timers={timers}
        failedImages={failedImages}
        onImageError={(key) => {
          console.warn('cooking step image load failed', recipe.title, key)
          setFailedImages((prev) => ({ ...prev, [key]: true }))
        }}
      />
    )
  }

  // ============ 空状态 ============
  if (!recipe) {
    return <DetailEmptyState variant={shareMiss ? 'share-miss' : 'not-found'} />
  }

  const steps = (recipe.steps as Step[]) || []

  return (
    <View style={{ minHeight: '100vh', backgroundColor: D.bg, paddingBottom: 110 }}>
      <RecipeHero
        recipe={recipe}
        isFavorite={isFavState}
        onToggleFavorite={handleToggleFavorite}
        heroFailed={Boolean(failedImages.hero)}
        onHeroError={() => {
          console.warn('recipe hero image load failed', recipe.title, recipe.image)
          setFailedImages((prev) => ({ ...prev, hero: true }))
        }}
        contextBar={
          pantryContext && pantryStore.totalCount > 0 ? (
            <PantryContextBar context={pantryContext} />
          ) : undefined
        }
      />

      <IngredientGrid
        ingredients={recipe.ingredients || []}
        pantryItems={pantryStore.items}
        onOpenShopping={() => setShowShopping(true)}
      />

      <RecipeStepsList
        steps={steps}
        timers={timers}
        failedImages={failedImages}
        onStepImageError={(key) => {
          console.warn('recipe step image load failed', recipe.title, key)
          setFailedImages((prev) => ({ ...prev, [key]: true }))
        }}
      />

      {recipe.nutritionAnalysis ? <NutritionInsight analysis={recipe.nutritionAnalysis} /> : null}

      <DetailBottomBar
        hasSteps={steps.length > 0}
        onMarkCooked={handleMarkCooked}
        onStartCooking={handleStartCooking}
      />

      <ShoppingListSheet
        visible={showShopping}
        items={shoppingListItems}
        onClose={() => setShowShopping(false)}
        onAddToList={(missing) => {
          householdStore.addShoppingItems(missing)
        }}
      />
    </View>
  )
}

export default observer(Detail)
