import { View, Text, Button, Image } from '@tarojs/components'
import Taro, { useRouter, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { useState, useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { usePantryStore } from '../../store/context'
import { findPantryItemForRecipeIngredient } from '../../utils/ingredientMatch'
import { D } from '../../theme/designTokens'
import { DEFAULT_RECIPES } from '../../data/recipes'
import { enrichRecipeMedia } from '../../utils/enrichRecipeMedia'
import {
  markAsCooked,
  isFavorite as readIsFavorite,
  toggleFavorite,
} from '../../store/storageUtils'
import { STORAGE_KEYS } from '../../store/storageKeys'
import type { Recipe, Step } from '../../types/recipe'
import { generateShoppingList } from '../../utils/shoppingList'
import { detectAndSaveNewAchievements, getUserStats } from '../../utils/achievements'
import { useParallelTimers, formatMMSS } from '../../hooks/useParallelTimers'
import { ShoppingListSheet } from '../../components/ShoppingListSheet'

const SHARE_PAYLOAD_LIMIT = 1500

function buildSharePayload(recipe: Recipe): string | null {
  try {
    const compact: Recipe = {
      id: recipe.id,
      title: recipe.title,
      source: recipe.source,
      quote: recipe.quote,
      emoji: recipe.emoji,
      time: recipe.time,
      difficulty: recipe.difficulty,
      nutritionAnalysis: recipe.nutritionAnalysis,
      ingredients:
        recipe.ingredients?.map((ing) => ({ name: ing.name, amount: ing.amount })) || [],
      steps:
        recipe.steps?.map((step) => ({
          content: step.content,
          time: step.time,
          tip: step.tip,
        })) || [],
    }
    const encoded = encodeURIComponent(JSON.stringify(compact))
    return encoded.length <= SHARE_PAYLOAD_LIMIT ? encoded : null
  } catch {
    return null
  }
}

function Detail() {
  const router = useRouter()
  const pantryStore = usePantryStore()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [shareMiss, setShareMiss] = useState(false)
  const [isFavState, setIsFavState] = useState(false)
  const [cookingMode, setCookingMode] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showShopping, setShowShopping] = useState(false)

  const timers = useParallelTimers()

  useShareAppMessage(() => {
    if (!recipe) return { title: '爱心厨房 - 今天吃什么？', path: '/pages/index/index' }
    const payload = buildSharePayload(recipe)
    try {
      Taro.setStorageSync(STORAGE_KEYS.sharedRecipeSnapshot, recipe)
    } catch (e) {
      console.warn('share snapshot save failed', e)
    }
    return {
      title: `今晚吃这个 👉【${recipe.title}】`,
      path: payload
        ? `/pages/detail/index?payload=${payload}`
        : `/pages/detail/index?shareId=${recipe.id}`,
      imageUrl: recipe.image || '',
    }
  })

  useShareTimeline(() => {
    if (!recipe) return { title: '爱心厨房 - 今天吃什么？' }
    return {
      title: `${recipe.emoji || '🍽️'} ${recipe.title} | ${recipe.time || 20} 分钟搞定`,
    }
  })

  useEffect(() => {
    const payload = router.params.payload
    if (payload) {
      try {
        const parsed = JSON.parse(decodeURIComponent(payload)) as Recipe
        const enriched = enrichRecipeMedia(parsed)
        setRecipe(enriched)
        setIsFavState(readIsFavorite(enriched.id))
        setShareMiss(false)
        return
      } catch (e) {
        console.warn('share payload parse failed', e)
      }
    }
    const shareId = router.params.shareId
    if (shareId) {
      const preset = DEFAULT_RECIPES.find((r) => String(r.id) === String(shareId))
      if (preset) {
        const enriched = enrichRecipeMedia(preset)
        setRecipe(enriched)
        setIsFavState(readIsFavorite(enriched.id))
        setShareMiss(false)
        return
      }
      try {
        const snap = Taro.getStorageSync(STORAGE_KEYS.sharedRecipeSnapshot) as Recipe | null
        if (snap && String(snap.id) === String(shareId)) {
          const enriched = enrichRecipeMedia(snap)
          setRecipe(enriched)
          setIsFavState(readIsFavorite(enriched.id))
          setShareMiss(false)
          return
        }
      } catch (e) {
        console.warn('share snapshot read failed', e)
      }
      setRecipe(null)
      setShareMiss(true)
      return
    }
    setShareMiss(false)
    const data = Taro.getStorageSync(STORAGE_KEYS.selectedRecipeDetail) as Recipe | null
    if (data) {
      const enriched = enrichRecipeMedia(data)
      setRecipe(enriched)
      setIsFavState(readIsFavorite(enriched.id))
    } else setRecipe(null)
  }, [router.params.shareId, router.params.payload])

  const handleToggleFavorite = () => {
    if (!recipe) return
    const next = toggleFavorite(recipe)
    setIsFavState(next)
    Taro.showToast({ title: next ? '已收藏' : '已取消', icon: 'none' })
  }

  const handleStartCooking = () => {
    if (!recipe?.steps || recipe.steps.length === 0) return

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

  // ============ 烹饪模式（全屏） ============
  if (cookingMode && recipe?.steps) {
    const steps = recipe.steps as Step[]
    const totalSteps = steps.length
    const step = steps[currentStep]
    const isLastStep = currentStep === totalSteps - 1
    const timerKey = `step-${currentStep}`
    const t = timers.snapshot(timerKey)

    return (
      <View
        style={{
          minHeight: '100vh',
          backgroundColor: D.cookingBg,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <View
          style={{
            padding: '16px 20px',
            paddingTop: 'calc(20px + env(safe-area-inset-top))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            style={{ color: D.cookingMuted, fontSize: 15 }}
            onClick={exitCookingMode}
          >
            ← 退出
          </Text>
          <Text
            style={{
              color: D.cookingText,
              fontSize: 16,
              fontWeight: D.weightSemibold,
              maxWidth: '60%',
              textAlign: 'center',
            }}
            numberOfLines={1}
          >
            {recipe.title}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        <View
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '20px 28px',
          }}
        >
          <Text
            style={{
              fontSize: 68,
              fontWeight: D.weightBold,
              color: D.accentWarm,
              lineHeight: 1,
              marginBottom: 24,
            }}
          >
            {currentStep + 1}
            <Text
              style={{
                fontSize: 22,
                color: D.cookingMuted,
                fontWeight: D.weightMedium,
              }}
            >
              /{totalSteps}
            </Text>
          </Text>

          <Text
            style={{
              fontSize: 24,
              color: D.cookingText,
              lineHeight: 1.55,
              marginBottom: 20,
              letterSpacing: '-0.01em',
            }}
          >
            {step.content}
          </Text>

          {step.tip && (
            <View
              style={{
                fontSize: 14,
                color: D.accentWarm,
                backgroundColor: 'rgba(196,148,74,0.15)',
                padding: '12px 16px',
                borderRadius: D.radiusM,
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              <Text style={{ color: D.accentWarm }}>💡 {step.tip}</Text>
            </View>
          )}

          {step.time && step.time > 0 && (
            <View
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginTop: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: D.weightBold,
                  color:
                    t && t.running ? D.accentWarm : D.cookingText,
                  fontFamily: 'monospace',
                }}
              >
                {formatMMSS(
                  t ? t.remaining : (step.time || 0) * 60
                )}
              </Text>
              <Button
                style={{
                  backgroundColor:
                    t && t.running ? D.cookingSurface : D.accent,
                  color: '#fff',
                  padding: '0 24px',
                  height: 44,
                  lineHeight: '44px',
                  borderRadius: 999,
                  fontSize: 15,
                  fontWeight: D.weightSemibold,
                  border: 'none',
                }}
                onClick={() => {
                  if (t && t.running) {
                    timers.pause(timerKey)
                  } else {
                    timers.start(timerKey, (step.time || 1) * 60)
                  }
                }}
              >
                {t && t.running ? '暂停' : t && t.remaining > 0 ? '继续' : '开始计时'}
              </Button>
            </View>
          )}
        </View>

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            paddingBottom: 16,
          }}
        >
          {steps.map((_, idx) => (
            <View
              key={idx}
              style={{
                width: idx === currentStep ? 28 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  idx === currentStep ? D.accentWarm : D.cookingSurface,
                transition: 'width 220ms ease',
              }}
            />
          ))}
        </View>

        <View
          style={{
            display: 'flex',
            gap: 12,
            padding: `16px 24px`,
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
          }}
        >
          <Button
            style={{
              flex: 1,
              height: 52,
              borderRadius: 999,
              fontSize: 16,
              fontWeight: D.weightSemibold,
              backgroundColor:
                currentStep === 0 ? D.cookingSurface : D.cookingText,
              color: currentStep === 0 ? D.cookingMuted : D.cookingBg,
              opacity: currentStep === 0 ? 0.5 : 1,
              border: 'none',
            }}
            onClick={() => currentStep > 0 && setCurrentStep((p) => p - 1)}
            disabled={currentStep === 0}
          >
            上一步
          </Button>
          <Button
            style={{
              flex: 1.3,
              height: 52,
              borderRadius: 999,
              fontSize: 16,
              fontWeight: D.weightSemibold,
              backgroundColor: D.accent,
              color: '#fff',
              border: 'none',
            }}
            onClick={() => {
              if (isLastStep) {
                Taro.showToast({ title: '完工！', icon: 'success' })
                handleMarkCooked()
                exitCookingMode()
              } else {
                setCurrentStep((p) => p + 1)
              }
            }}
          >
            {isLastStep ? '完成' : '下一步'}
          </Button>
        </View>
      </View>
    )
  }

  // ============ 空状态 ============
  if (!recipe) {
    if (shareMiss) {
      return (
        <View
          style={{
            padding: 40,
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            backgroundColor: D.bg,
          }}
        >
          <Text
            style={{
              fontSize: D.body,
              color: D.labelSecondary,
              textAlign: 'center',
              lineHeight: 1.55,
            }}
          >
            分享菜谱内容已超出小程序可承载范围。请让对方在小程序内重新打开后再分享。
          </Text>
          <Button
            style={{
              backgroundColor: D.accent,
              color: '#fff',
              borderRadius: 999,
              border: 'none',
            }}
            onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
          >
            回首页
          </Button>
        </View>
      )
    }
    return (
      <View
        style={{
          padding: 40,
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          backgroundColor: D.bg,
        }}
      >
        <Text
          style={{
            fontSize: D.body,
            color: D.labelSecondary,
            textAlign: 'center',
            lineHeight: 1.55,
          }}
        >
          这道菜还没有准备好展示。回首页重新搜索，或从收藏里进入。
        </Text>
        <Button
          style={{
            backgroundColor: D.accent,
            color: '#fff',
            borderRadius: 999,
            border: 'none',
          }}
          onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
        >
          回首页
        </Button>
      </View>
    )
  }

  const steps = (recipe.steps as Step[]) || []

  return (
    <View style={{ minHeight: '100vh', backgroundColor: D.bg, paddingBottom: 110 }}>
      {/* 头图：图优先；无图则纯色 emoji 卡 */}
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
        {recipe.image ? (
          <Image
            src={recipe.image}
            mode="aspectFill"
            lazyLoad
            style={{ width: '100%', height: 260, display: 'block', backgroundColor: D.bg }}
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

        {/* 浮层操作（收藏 / 分享） */}
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
            onClick={handleToggleFavorite}
          >
            <Text
              style={{
                fontSize: 20,
                color: isFavState ? D.accentWarm : D.labelSecondary,
              }}
            >
              {isFavState ? '♥' : '♡'}
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

        <View
          style={{
            padding: '20px 22px 22px',
          }}
        >
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
          <View
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 14,
            }}
          >
            {recipe.time ? (
              <Text
                style={{
                  fontSize: D.caption,
                  color: D.labelSecondary,
                  backgroundColor: D.bg,
                  padding: '5px 10px',
                  borderRadius: 999,
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
                  color: D.accent,
                  backgroundColor: D.accentMuted,
                  padding: '5px 10px',
                  borderRadius: 999,
                }}
              >
                {tag}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* 用料 */}
      <View style={{ padding: `28px ${D.pagePadH}px 8px` }}>
        <View
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: D.caption,
              fontWeight: D.weightSemibold,
              color: D.labelSecondary,
              letterSpacing: '0.14em',
              textTransform: 'uppercase' as const,
            }}
          >
            用料
          </Text>
          {recipe.ingredients && recipe.ingredients.length > 0 ? (
            <Text
              className="tap-scale"
              style={{
                fontSize: D.footnote,
                color: D.accent,
                fontWeight: D.weightSemibold,
              }}
              onClick={() => setShowShopping(true)}
            >
              采购清单 →
            </Text>
          ) : null}
        </View>
        <View
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          {recipe.ingredients?.map((ing, idx) => {
            const hasIt = !!findPantryItemForRecipeIngredient(
              pantryStore.items,
              ing.name
            )
            return (
              <View
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  backgroundColor: D.bgElevated,
                  borderRadius: D.radiusM,
                  border: `0.5px solid ${D.separatorLight}`,
                  gap: 6,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: D.subheadline,
                      color: D.label,
                      fontWeight: D.weightMedium,
                    }}
                  >
                    {ing.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: D.caption,
                      color: D.labelTertiary,
                      marginTop: 2,
                    }}
                  >
                    {ing.amount}
                  </Text>
                </View>
                {hasIt ? (
                  <Text
                    style={{
                      fontSize: 10,
                      color: D.green,
                      backgroundColor: 'rgba(74,140,108,0.12)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontWeight: D.weightSemibold,
                    }}
                  >
                    有
                  </Text>
                ) : null}
              </View>
            )
          })}
        </View>
      </View>

      {/* 步骤 */}
      <View style={{ padding: `8px ${D.pagePadH}px 28px` }}>
        <Text
          style={{
            fontSize: D.caption,
            fontWeight: D.weightSemibold,
            color: D.labelSecondary,
            marginBottom: 16,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
          }}
        >
          步骤
        </Text>
        {steps.map((step, idx) => {
          const timerKey = `ns-${idx}`
          const t = timers.snapshot(timerKey)
          return (
            <View
              key={idx}
              style={{
                marginBottom: 16,
                display: 'flex',
                gap: 12,
                padding: '14px 14px',
                backgroundColor: D.bgElevated,
                borderRadius: D.radiusM,
                border: `0.5px solid ${D.separatorLight}`,
              }}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  backgroundColor: D.accent,
                  borderRadius: 15,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontWeight: D.weightBold,
                    fontSize: 13,
                  }}
                >
                  {idx + 1}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontSize: D.body,
                    color: D.label,
                    lineHeight: 1.6,
                  }}
                >
                  {step.content}
                </Text>
                {step.tip ? (
                  <View
                    style={{
                      fontSize: D.footnote,
                      color: D.accentWarm,
                      backgroundColor: D.accentWarmMuted,
                      padding: '8px 12px',
                      borderRadius: D.radiusS,
                      marginTop: 10,
                    }}
                  >
                    <Text style={{ fontSize: D.footnote, color: D.accentWarm }}>
                      💡 {step.tip}
                    </Text>
                  </View>
                ) : null}
                {step.time && step.time > 0 ? (
                  <View
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginTop: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: D.footnote,
                        color: t && t.running ? D.accentWarm : D.labelTertiary,
                        fontFamily: 'monospace',
                        fontWeight: D.weightSemibold,
                      }}
                    >
                      {formatMMSS(t ? t.remaining : step.time * 60)}
                    </Text>
                    <Text
                      className="tap-scale"
                      style={{
                        fontSize: D.caption,
                        fontWeight: D.weightSemibold,
                        color: t && t.running ? D.errorFg : D.accent,
                        backgroundColor:
                          t && t.running ? D.errorBg : D.accentMuted,
                        padding: '4px 12px',
                        borderRadius: 999,
                      }}
                      onClick={() => {
                        if (t && t.running) {
                          timers.pause(timerKey)
                        } else {
                          timers.start(timerKey, step.time! * 60)
                        }
                      }}
                    >
                      {t && t.running
                        ? '暂停'
                        : t && t.remaining > 0
                        ? '继续'
                        : '计时 ' + step.time + ' 分'}
                    </Text>
                    {t && !t.running && t.remaining > 0 ? (
                      <Text
                        className="tap-scale"
                        style={{
                          fontSize: D.caption,
                          color: D.labelTertiary,
                        }}
                        onClick={() => timers.reset(timerKey)}
                      >
                        重置
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          )
        })}
      </View>

      {/* 营养洞察 */}
      {recipe.nutritionAnalysis ? (
        <View style={{ padding: `0 ${D.pagePadH}px 28px` }}>
          <View
            style={{
              backgroundColor: D.bgElevated,
              padding: 16,
              borderRadius: D.radiusM,
              border: `0.5px solid ${D.separatorLight}`,
            }}
          >
            <Text
              style={{
                color: D.green,
                fontWeight: D.weightSemibold,
                fontSize: D.caption,
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
                marginBottom: 8,
              }}
            >
              营养洞察
            </Text>
            <Text
              style={{
                color: D.labelSecondary,
                fontSize: D.footnote,
                lineHeight: 1.6,
              }}
            >
              {recipe.nutritionAnalysis}
            </Text>
          </View>
        </View>
      ) : null}

      {/* 底部主 CTA */}
      <View
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          padding: `12px ${D.pagePadH}px`,
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          backgroundColor: D.bgGlassHeavy,
          backdropFilter: 'blur(20px)',
          borderTop: `0.5px solid ${D.separatorLight}`,
          boxSizing: 'border-box',
          display: 'flex',
          gap: 10,
        }}
      >
        <Button
          style={{
            flex: 1,
            height: 52,
            borderRadius: 999,
            backgroundColor: D.bgElevated,
            color: D.label,
            border: `0.5px solid ${D.separator}`,
            fontSize: D.subheadline,
            fontWeight: D.weightSemibold,
          }}
          onClick={handleMarkCooked}
        >
          做过啦
        </Button>
        <Button
          style={{
            flex: 1.6,
            height: 52,
            borderRadius: 999,
            backgroundColor: D.accent,
            color: '#fff',
            fontWeight: D.weightSemibold,
            fontSize: D.body,
            border: 'none',
          }}
          onClick={handleStartCooking}
        >
          {steps.length > 0 ? '开始做' : '暂无步骤'}
        </Button>
      </View>

      <ShoppingListSheet
        visible={showShopping}
        items={shoppingListItems}
        onClose={() => setShowShopping(false)}
      />
    </View>
  )
}

export default observer(Detail)
