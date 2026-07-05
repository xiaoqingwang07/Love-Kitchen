import { View } from '@tarojs/components'
import Taro, { useShareAppMessage } from '@tarojs/taro'
import { useState, useCallback, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { usePantryStore, useHouseholdStore } from '../../store/context'
import {
  getFavoriteCount,
  getFavoriteDetails,
  getCookedRecipes,
  toggleFavorite,
} from '../../store/storageUtils'
import { WeeklyMenuCard } from './components/WeeklyMenuCard'
import { ShoppingListPanel } from './components/ShoppingListPanel'
import { HouseholdPanel } from './components/HouseholdPanel'
import { PreferencePanel } from './components/PreferencePanel'
import { FavoritesListPage } from './components/FavoritesListPage'
import { CookedHistoryPage } from './components/CookedHistoryPage'
import { AboutPage } from './components/AboutPage'
import { DevToolsPanel } from './components/DevToolsPanel'
import { ProfileStatsHeader } from './components/ProfileStatsHeader'
import { ExpiryReminderCard } from './components/ExpiryReminderCard'
import { LlmServiceStatusCard } from './components/LlmServiceStatusCard'
import { ProfileAboutRow } from './components/ProfileAboutRow'
import { setSelectedRecipeForDetail } from '../../utils/navigationPayload'
import { getStoredScene, setStoredScene, usesLlmProxy } from '../../api/recipe'
import { D } from '../../theme/designTokens'
import type { SceneType } from '../../types/recipe'
import type { Recipe } from '../../types/recipe'
import { getUserStats, getAllAchievements } from '../../utils/achievements'
import { copyAnalyticsExport, clearAnalyticsEvents } from '../../utils/analyticsExport'
import { resolvePrimedShare } from '../../utils/shareLinks'
import { useProfileLifecycle } from './useProfileLifecycle'

const SCENE_OPTIONS: { key: SceneType; label: string }[] = [
  { key: 'normal', label: '日常' },
  { key: 'runner', label: '运动后' },
  { key: 'quick', label: '快手' },
  { key: 'muscle', label: '高蛋白' },
]

function Profile() {
  const pantryStore = usePantryStore()
  const householdStore = useHouseholdStore()

  useShareAppMessage(() =>
    resolvePrimedShare({
      title: '爱心厨房 - 一起管冰箱、定今晚吃什么',
      path: '/pages/index/index',
    })
  )

  const [showHistory, setShowHistory] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [cookedRecipes, setCookedRecipes] = useState<(Recipe & { cookedAt: number })[]>([])
  const [recipeScene, setRecipeScene] = useState<SceneType>(() => getStoredScene())
  const [showFavorites, setShowFavorites] = useState(false)
  const [favoriteItems, setFavoriteItems] = useState<Recipe[]>([])
  const [aboutTaps, setAboutTaps] = useState(0)

  const loadFavoriteItems = useCallback(() => {
    setFavoriteItems(getFavoriteDetails())
  }, [])

  const openFavorites = useCallback(() => {
    loadFavoriteItems()
    setShowFavorites(true)
  }, [loadFavoriteItems])

  const {
    apiKeyValid,
    dinersCount,
    devUnlocked,
    setDevUnlocked,
    reminderOn,
    handleToggleReminder,
    handleDinersChange,
    handleTestLlmProxy,
  } = useProfileLifecycle(pantryStore, householdStore, openFavorites)

  const applyScene = (k: SceneType) => {
    setRecipeScene(k)
    setStoredScene(k)
    Taro.showToast({ title: '已保存', icon: 'success' })
  }

  const favCount = getFavoriteCount()
  const cookedLen = getCookedRecipes().length

  const stats: { label: string; value: number; action: 'pantry' | 'favorites' | 'cooked' }[] = [
    { label: '冰箱食材', value: pantryStore.totalCount, action: 'pantry' },
    { label: '收藏', value: favCount, action: 'favorites' },
    { label: '做过', value: cookedLen, action: 'cooked' },
  ]

  const userStats = useMemo(() => getUserStats(pantryStore.items), [pantryStore.items])
  const allAchievements = useMemo(() => getAllAchievements(userStats), [userStats])

  const onStatClick = (action: 'pantry' | 'favorites' | 'cooked') => {
    if (action === 'pantry') {
      Taro.switchTab({ url: '/pages/pantry/index' })
      return
    }
    if (action === 'favorites') {
      openFavorites()
      return
    }
    setCookedRecipes(getCookedRecipes())
    setShowHistory(true)
  }

  const handleResetMock = () => {
    Taro.showModal({
      title: '重置冰箱数据',
      content: '这会把冰箱清空并填入 18 条示例食材，当前库存全部丢失。继续？',
      confirmText: '重置',
      confirmColor: '#F5412C',
      success: (res) => {
        if (res.confirm) {
          Taro.showModal({
            title: '再次确认',
            content: '此操作不可撤销',
            confirmText: '确认重置',
            confirmColor: '#F5412C',
            success: (r2) => {
              if (r2.confirm) {
                pantryStore.resetToMock()
                Taro.showToast({ title: '已重置', icon: 'success' })
              }
            },
          })
        }
      },
    })
  }

  const handleClearFridge = () => {
    Taro.showModal({
      title: '清空冰箱',
      content: '把冰箱里所有食材清空（用于测试空库状态），当前库存全部丢失。继续？',
      confirmText: '清空',
      confirmColor: '#F5412C',
      success: (res) => {
        if (res.confirm) {
          pantryStore.clearAll()
          Taro.showToast({ title: '已清空', icon: 'success' })
        }
      },
    })
  }

  if (showFavorites) {
    return (
      <FavoritesListPage
        items={favoriteItems}
        onBack={() => setShowFavorites(false)}
        onOpenRecipe={(r) => {
          setSelectedRecipeForDetail(r)
          Taro.navigateTo({ url: '/pages/detail/index' })
        }}
        onUnfavorite={(r) => {
          toggleFavorite(r)
          loadFavoriteItems()
          Taro.showToast({ title: '已取消', icon: 'none' })
        }}
      />
    )
  }

  if (showHistory) {
    return (
      <CookedHistoryPage
        items={cookedRecipes}
        onBack={() => setShowHistory(false)}
        onOpenRecipe={(item) => {
          setSelectedRecipeForDetail(item)
          Taro.navigateTo({ url: '/pages/detail/index' })
        }}
      />
    )
  }

  if (showAbout) {
    return (
      <AboutPage
        onBack={() => {
          setShowAbout(false)
          setAboutTaps(0)
        }}
        onLogoTap={() => {
          const next = aboutTaps + 1
          setAboutTaps(next)
          if (next >= 7) {
            setDevUnlocked(true)
            Taro.showToast({ title: '已解锁开发者选项', icon: 'none' })
          }
        }}
      />
    )
  }

  return (
    <View style={{ minHeight: '100vh', backgroundColor: D.bg, paddingBottom: 40 }}>
      <ProfileStatsHeader stats={stats} achievements={allAchievements} onStatClick={onStatClick} />

      <View style={{ padding: '0 22px 32px' }}>
        <PreferencePanel
          recipeScene={recipeScene}
          dinersCount={dinersCount}
          sceneOptions={SCENE_OPTIONS}
          onSceneChange={applyScene}
          onDinersChange={handleDinersChange}
        />

        <ShoppingListPanel />

        <HouseholdPanel />

        <WeeklyMenuCard pantryItems={pantryStore.items} />

        <ExpiryReminderCard
          enabled={reminderOn}
          onToggle={() => {
            void handleToggleReminder()
          }}
        />

        {usesLlmProxy() ? <LlmServiceStatusCard valid={apiKeyValid} /> : null}

        <ProfileAboutRow onOpen={() => setShowAbout(true)} />

        {devUnlocked ? (
          <DevToolsPanel
            onCopyAnalytics={copyAnalyticsExport}
            onClearAnalytics={() => {
              clearAnalyticsEvents()
              Taro.showToast({ title: '埋点已清空', icon: 'none' })
            }}
            onTestLlmProxy={() => {
              void handleTestLlmProxy()
            }}
            onResetMock={handleResetMock}
            onClearFridge={handleClearFridge}
          />
        ) : null}
      </View>
    </View>
  )
}

export default observer(Profile)
