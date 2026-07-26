import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { getSearchHistory, addSearchHistory, clearSearchHistory } from '../../store/storageUtils'
import { fetchLiveWeather, type WeatherData } from '../../api/weather'
import {
  getPersonalizedRecommendations,
  getWeatherRecommendationsForWeather,
  getReasonText,
} from '../../utils/recommend'
import { looksLikeIngredientList } from '../../utils/recipeSearch'
import { initCatalog } from '../../data/catalogLoader'
import { findRecipeByTitleExact, resolveFullRecipe } from '../../data/recipeRegistry'
import { usePantryStore } from '../../store/context'
import { setSelectedRecipeForDetail, consumeAutoSearchIngredient } from '../../utils/navigationPayload'
import { getFreshnessStatus } from '../../types/pantry'
import { recognizeDishCandidates, DishVisionError, type DishCandidate } from '../../api/dishVision'
import { VoiceRecorderSheet } from '../../components/VoiceRecorderSheet'
import { trackEvent } from '../../utils/analytics'
import type { Recipe } from '../../types/recipe'
import { HomeSearchBar } from './components/HomeSearchBar'
import { HomePantryBanner } from './components/HomePantryBanner'
import { HomeKitchenStatus, loadDemoPantryAndGoMeal, buildMealResultPath } from './components/HomeKitchenStatus'
import { HomeRecommendSection } from './components/HomeRecommendSection'
import { DishCandidateSheet } from './components/DishCandidateSheet'
import * as S from './styles'

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 首屏日期锚点，如「7月26日 · 周日」 */
function formatTodayLabel(): string {
  const d = new Date()
  return `${d.getMonth() + 1}月${d.getDate()}日 · ${WEEKDAYS[d.getDay()]}`
}

/**
 * 首页：单一搜索台 + 诚实推荐
 *
 * 设计原则：
 * 1. 搜索框是唯一首屏主动作：文字、拍照、相册、语音四合一；
 * 2. 默认不虚构天气——用户主动点「开启天气」才会去定位+叠加推荐维度；
 * 3. 临期提醒置顶于搜索框之前：临期是有时效的坏消息，晚看一天就浪费；
 *    冰箱无临期时该条整体不渲染，首屏更干净；
 * 4. 不再展示「场景 chip」，场景偏好改由「我的」一次性设定。
 */
function Index() {
  const pantryStore = usePantryStore()
  const [inputValue, setInputValue] = useState('')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [listVariant, setListVariant] = useState(0)
  const [catalogTick, setCatalogTick] = useState(0)
  const [showVoice, setShowVoice] = useState(false)
  const [dishCandidates, setDishCandidates] = useState<DishCandidate[] | null>(null)

  const expiringItems = useMemo(
    () => pantryStore.items.filter((i) => getFreshnessStatus(i) !== 'fresh'),
    [pantryStore.items]
  )

  const recommendation = useMemo(() => {
    if (weather) {
      return {
        recipes: getWeatherRecommendationsForWeather(weather, 10, listVariant).recipes,
        reason: getReasonText(weather),
      }
    }
    const personalized = getPersonalizedRecommendations(10, listVariant)
    return {
      recipes: personalized.recipes,
      reason: personalized.personalized ? '按你常做的口味 · 猜你想吃' : '每日家常 · 高分稳妥',
    }
  }, [weather, listVariant, catalogTick])

  useDidShow(() => {
    void initCatalog().then(() => setCatalogTick((n) => n + 1))
    const autoSearch = consumeAutoSearchIngredient()
    if (autoSearch) {
      setInputValue(autoSearch)
    }
    loadSearchHistory()
  })

  const loadSearchHistory = () => {
    try {
      const history = getSearchHistory()
      setSearchHistory(history.map((h) => h.keywords))
    } catch (e) {
      console.error('Load history failed:', e)
    }
  }

  const openRecipeDetail = async (item: Recipe) => {
    trackEvent('recipe_open', { surface: 'home', source: item.source ?? 'local' })
    Taro.showLoading({ title: '加载中', mask: true })
    try {
      const full = await resolveFullRecipe({ ...item, source: item.source ?? 'local' })
      setSelectedRecipeForDetail(full)
      Taro.navigateTo({ url: '/pages/detail/index' })
    } finally {
      Taro.hideLoading()
    }
  }

  const doSearch = (raw: string) => {
    const keyword = raw.trim()
    if (!keyword) {
      Taro.showToast({ title: '告诉我冰箱里有什么', icon: 'none' })
      return
    }
    addSearchHistory(keyword)
    loadSearchHistory()
    setShowHistory(false)

    const q = encodeURIComponent(keyword)
    const searchType = looksLikeIngredientList(keyword) ? 'ingredients' : 'dish'
    trackEvent('search_submit', {
      surface: 'home',
      type: searchType,
      keywordLength: keyword.length,
      pantryCount: pantryStore.totalCount,
    })

    if (searchType === 'ingredients') {
      Taro.navigateTo({ url: `/pages/result/index?from=ai&ingredients=${q}` })
      return
    }

    const exact = findRecipeByTitleExact(keyword)
    if (exact) {
      void openRecipeDetail(exact)
      return
    }

    Taro.navigateTo({ url: `/pages/result/index?from=dish&dish=${q}` })
  }

  const handleGenerate = () => doSearch(inputValue)

  const handleHistoryClick = (keyword: string) => {
    setInputValue(keyword)
    setShowHistory(false)
    doSearch(keyword)
  }

  const handleClearHistory = () => {
    clearSearchHistory()
    setSearchHistory([])
    Taro.showToast({ title: '已清空', icon: 'none' })
  }

  const handlePickDish = async (source: 'camera' | 'album') => {
    let filePath = ''
    try {
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: [source],
        sizeType: ['compressed'],
        camera: 'back',
      })
      filePath = res.tempFiles?.[0]?.tempFilePath || ''
    } catch {
      return
    }
    if (!filePath) return

    Taro.showLoading({ title: '识别这道菜…', mask: true })
    try {
      const candidates = await recognizeDishCandidates(filePath)
      Taro.hideLoading()
      if (candidates.length === 1) {
        trackEvent('dish_vision_success', { source, candidates: 1 })
        doSearch(candidates[0].name)
        return
      }
      trackEvent('dish_vision_success', { source, candidates: candidates.length })
      setDishCandidates(candidates)
    } catch (e) {
      Taro.hideLoading()
      trackEvent('dish_vision_fail', { source })
      const msg = e instanceof DishVisionError ? e.message : '识别失败，换张照片试试'
      Taro.showToast({ title: msg, icon: 'none', duration: 2200 })
    }
  }

  const pickDishCandidate = (name: string) => {
    setDishCandidates(null)
    doSearch(name)
  }

  const handleVoiceRecorded = () => {
    setShowVoice(false)
    Taro.showToast({ title: '语音已保存', icon: 'none' })
    Taro.switchTab({ url: '/pages/pantry/index' })
  }

  const handleVoiceTranscribed = (text: string) => {
    setShowVoice(false)
    const t = text.trim()
    if (!t) return
    setInputValue(t)
    doSearch(t)
  }

  const enableWeather = () => {
    setWeatherLoading(true)
    void fetchLiveWeather()
      .then((live) => {
        if (live) {
          setWeather(live)
          trackEvent('weather_enabled', { ok: true })
          Taro.showToast({ title: '已接入实时天气', icon: 'success' })
        } else {
          trackEvent('weather_enabled', { ok: false })
          Taro.showToast({ title: '暂时无法获取，请稍后重试', icon: 'none' })
        }
      })
      .finally(() => setWeatherLoading(false))
  }

  const emptyPantry = pantryStore.totalCount === 0
  const showGenericRecommend = !emptyPantry && expiringItems.length === 0

  const goTonightMeal = () => {
    Taro.navigateTo({ url: buildMealResultPath(pantryStore.items, 'home-status') })
  }

  return (
    <View style={S.pageStyle}>
      <View style={S.headerRowStyle}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text className="lk-block" style={S.dateKickerStyle}>
            {formatTodayLabel()}
          </Text>
          <Text className="lk-title" style={S.titleStyle}>
            今晚吃什么？
          </Text>
        </View>
      </View>

      <HomePantryBanner
        expiringItems={expiringItems}
        emptyPantry={emptyPantry}
        onLoadDemo={() => loadDemoPantryAndGoMeal(pantryStore)}
      />

      <HomeSearchBar
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSearch={handleGenerate}
        showHistory={showHistory}
        onShowHistory={setShowHistory}
        searchHistory={searchHistory}
        onHistoryClick={handleHistoryClick}
        onClearHistory={handleClearHistory}
        onPickDish={handlePickDish}
        onOpenVoice={() => setShowVoice(true)}
        onHotWordSearch={(word) => {
          setInputValue(word)
          doSearch(word)
        }}
        onFocusLoadHistory={loadSearchHistory}
      />

      <HomeKitchenStatus expiringCount={expiringItems.length} onTonightMeal={goTonightMeal} />

      {showGenericRecommend ? (
        <HomeRecommendSection
          recipes={recommendation.recipes}
          reason={recommendation.reason}
          weather={weather}
          weatherLoading={weatherLoading}
          onEnableWeather={enableWeather}
          onRefresh={() => setListVariant((v) => v + 1)}
          onCardClick={(item) => void openRecipeDetail(item)}
        />
      ) : null}

      <VoiceRecorderSheet
        visible={showVoice}
        onClose={() => setShowVoice(false)}
        onRecorded={handleVoiceRecorded}
        onTranscribed={handleVoiceTranscribed}
      />

      {dishCandidates ? (
        <DishCandidateSheet
          candidates={dishCandidates}
          onPick={pickDishCandidate}
          onClose={() => setDishCandidates(null)}
        />
      ) : null}
    </View>
  )
}

export default observer(Index)
