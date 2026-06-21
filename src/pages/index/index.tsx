import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { getSearchHistory, addSearchHistory, clearSearchHistory } from '../../store/storageUtils'
import { fetchLiveWeather, type WeatherData } from '../../api/weather'
import {
  getDailyRecommendations,
  getPersonalizedRecommendations,
  getWeatherRecommendationsForWeather,
  getReasonText,
} from '../../utils/recommend'
import { enrichRecipeMedia } from '../../utils/enrichRecipeMedia'
import { looksLikeIngredientList, searchRecipesByTitle } from '../../utils/recipeSearch'
import { initCatalog } from '../../data/catalogLoader'
import { findRecipeByTitleExact, resolveFullRecipe } from '../../data/recipeRegistry'
import { usesLlmProxy } from '../../api/recipe'
import { usePantryStore } from '../../store/context'
import { STORAGE_KEYS } from '../../store/storageKeys'
import { getFreshnessStatus } from '../../types/pantry'
import { pickImageForIntake } from '../../utils/mediaIntake'
import { VoiceRecorderSheet } from '../../components/VoiceRecorderSheet'
import type { Recipe } from '../../types/recipe'
import { D } from '../../theme/designTokens'
import * as S from './styles'

/**
 * 首页：单一搜索台 + 诚实推荐
 *
 * 设计原则：
 * 1. 搜索框是唯一首屏主动作：文字、拍照、相册、语音四合一；
 * 2. 默认不虚构天气——用户主动点「开启天气」才会去定位+叠加推荐维度；
 * 3. 若冰箱中有临期食材，升级卡片替代普通欢迎语；
 * 4. 不再展示「场景 chip」，场景偏好改由「我的」一次性设定。
 */

/** 本地热词列表：按使用频率 / 季节 / 中餐热度排列，每次可静态更新 */
const HOT_WORDS = [
  '番茄炒蛋', '红烧肉', '宫保鸡丁', '麻婆豆腐', '可乐鸡翅',
  '蒜蓉西兰花', '葱油拌面', '皮蛋豆腐', '辣椒炒肉', '鱼香肉丝',
  '土豆炖牛肉', '蒸鸡蛋', '炒青菜', '回锅肉', '白灼虾',
]
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

  const skipSearchBlurRef = useRef(false)

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
    const autoSearch = Taro.getStorageSync(STORAGE_KEYS.autoSearchIngredient)
    if (autoSearch) {
      setInputValue(String(autoSearch))
      Taro.removeStorageSync(STORAGE_KEYS.autoSearchIngredient)
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
    Taro.showLoading({ title: '加载中', mask: true })
    try {
      const full = await resolveFullRecipe({ ...item, source: item.source ?? 'local' })
      Taro.setStorageSync(STORAGE_KEYS.selectedRecipeDetail, full)
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

    // 食材清单（含逗号等）→ 按食材匹配 + AI
    if (looksLikeIngredientList(keyword)) {
      Taro.navigateTo({ url: `/pages/result/index?from=ai&ingredients=${q}` })
      return
    }

    // 精确命中一道菜 → 直达详情
    const exact = findRecipeByTitleExact(keyword)
    if (exact) {
      void openRecipeDetail(exact)
      return
    }

    // 菜名模糊搜索 / 库中暂无 → 结果页统一处理（含 AI 生成、心愿单）
    Taro.navigateTo({ url: `/pages/result/index?from=dish&dish=${q}` })
  }

  const handleGenerate = () => doSearch(inputValue)

  const handleRandom = () => Taro.navigateTo({ url: '/pages/result/index?from=random' })

  const handleCardClick = (item: Recipe) => {
    void openRecipeDetail(item)
  }

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

  const handlePickImage = async (source: 'camera' | 'album') => {
    const draft = await pickImageForIntake(source, 'ingredients')
    if (!draft) return
    Taro.showToast({
      title: usesLlmProxy() ? '识别中，去冰箱看看' : '已采集，去冰箱核对',
      icon: 'none',
    })
    Taro.switchTab({ url: '/pages/pantry/index' })
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
          Taro.showToast({ title: '已接入实时天气', icon: 'success' })
        } else {
          Taro.showToast({ title: '暂时无法获取，请稍后重试', icon: 'none' })
        }
      })
      .finally(() => setWeatherLoading(false))
  }

  const hasInput = inputValue.trim().length > 0
  const emptyPantry = pantryStore.totalCount === 0

  return (
    <View style={S.pageStyle}>
      {/* 顶栏：标题 + 收藏入口 */}
      <View style={S.headerRowStyle}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={S.titleStyle}>今天做什么</Text>
          <Text style={S.titleHintStyle}>
            有食材就搜索，没思路就看推荐
          </Text>
        </View>
        <Text
          className="tap-scale"
          style={S.headerLinkStyle}
          onClick={() => {
            try {
              Taro.setStorageSync(STORAGE_KEYS.profileOpenFavorites, '1')
            } catch {
              /* ignore */
            }
            Taro.switchTab({ url: '/pages/profile/index' })
          }}
        >
          收藏
        </Text>
      </View>

      {/* 统一搜索框：文字 · 拍照 · 相册 · 语音 */}
      <View style={S.searchSectionStyle}>
        <View style={S.searchShellStyle}>
          <Text style={S.searchIconStyle}>⌕</Text>
          <Input
            style={S.searchInputStyle}
            placeholder="番茄、鸡蛋、鸡胸肉…"
            placeholderStyle={`color: ${D.labelTertiary}`}
            value={inputValue}
            confirmType="search"
            onInput={(e) => setInputValue(e.detail.value)}
            onFocus={() => {
              loadSearchHistory()
              setShowHistory(true)
            }}
            onBlur={() => {
              setTimeout(() => {
                if (!skipSearchBlurRef.current) setShowHistory(false)
                skipSearchBlurRef.current = false
              }, 260)
            }}
            onConfirm={handleGenerate}
          />

          {hasInput ? (
            <View className="tap-scale" style={S.searchSubmitStyle} onClick={handleGenerate}>
              <Text style={S.searchSubmitTextStyle}>搜索</Text>
            </View>
          ) : (
            <View style={S.searchActionsStyle}>
              <View
                className="tap-scale"
                style={S.searchActionBtnStyle}
                onTouchStart={() => { skipSearchBlurRef.current = true }}
                onClick={() => {
                  Taro.showToast({ title: '语音说出你的食材', icon: 'none', duration: 1500 })
                  setShowVoice(true)
                }}
              >
                <Text style={{ fontSize: 18 }}>🎙</Text>
              </View>
              <View
                className="tap-scale"
                style={S.searchActionBtnStyle}
                onTouchStart={() => { skipSearchBlurRef.current = true }}
                onClick={() => {
                  handlePickImage('album')
                }}
              >
                <Text style={{ fontSize: 18 }}>🖼</Text>
              </View>
              <View
                className="tap-scale"
                style={S.searchActionBtnStyle}
                onTouchStart={() => { skipSearchBlurRef.current = true }}
                onClick={() => {
                  handlePickImage('camera')
                }}
              >
                <Text style={{ fontSize: 18 }}>📷</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 搜索历史 + 热词联想（聚焦时展示） */}
      {showHistory && (
        <View
          style={S.historyBoxStyle}
          onTouchStart={() => {
            skipSearchBlurRef.current = true
          }}
        >
          <View style={S.historyHeaderStyle}>
            <Text style={S.historyTitleStyle}>最近搜索</Text>
            {searchHistory.length > 0 && (
              <Text
                className="tap-scale"
                style={S.clearBtnStyle}
                onClick={() => {
                  skipSearchBlurRef.current = true
                  handleClearHistory()
                }}
              >
                清除
              </Text>
            )}
          </View>
          {searchHistory.length === 0 ? (
            <Text
              style={{ fontSize: D.footnote, color: D.labelTertiary, padding: '0 2px 4px' }}
            >
              还没有记录，搜一次就会出现在这里
            </Text>
          ) : (
            <View style={S.historyListStyle}>
              {searchHistory.slice(0, 8).map((keyword, idx) => (
                <View
                  key={idx}
                  className="tap-scale"
                  style={S.historyTagStyle}
                  onTouchStart={() => {
                    skipSearchBlurRef.current = true
                  }}
                  onClick={() => handleHistoryClick(keyword)}
                >
                  <Text>{keyword}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 热词联想：常见菜名快速填入 */}
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: D.caption, color: D.labelTertiary, letterSpacing: '0.08em', marginBottom: 8, display: 'block' }}>
              大家都在搜
            </Text>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {HOT_WORDS.map((word) => (
                <View
                  key={word}
                  className="tap-scale"
                  style={{
                    padding: '5px 12px',
                    backgroundColor: D.bgElevated,
                    border: `0.5px solid ${D.separatorLight}`,
                    borderRadius: 99,
                  }}
                  onTouchStart={() => { skipSearchBlurRef.current = true }}
                  onClick={() => {
                    setInputValue(word)
                    skipSearchBlurRef.current = true
                    setShowHistory(false)
                    doSearch(word)
                  }}
                >
                  <Text style={{ fontSize: D.footnote, color: D.label }}>{word}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 临期优先卡片 / 空冰箱引导 */}
      {expiringItems.length > 0 ? (
        <View style={S.urgentCardStyle}>
          <Text style={S.urgentTitleStyle}>
            冰箱里有 {expiringItems.length} 样快过期的
          </Text>
          <Text style={S.urgentLeadStyle}>
            先处理掉它们：{expiringItems
              .slice(0, 3)
              .map((i) => i.name)
              .join('、')}
            {expiringItems.length > 3 ? ' 等' : ''}
          </Text>
          <View style={S.urgentActionsStyle}>
            <View
              className="tap-scale"
              style={S.urgentPrimaryBtnStyle}
              onClick={() => {
                Taro.setStorageSync(STORAGE_KEYS.pickAutoSelectIngredients, expiringItems.map((i) => i.name))
                Taro.switchTab({ url: '/pages/pick/index' })
              }}
            >
              <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: '#fff' }}>
                拿临期做一道
              </Text>
            </View>
            <View
              className="tap-scale"
              style={S.urgentSecondaryBtnStyle}
              onClick={() => Taro.switchTab({ url: '/pages/pantry/index' })}
            >
              <Text style={{ fontSize: D.subheadline, fontWeight: D.weightMedium, color: D.label }}>
                去冰箱看看
              </Text>
            </View>
          </View>
        </View>
      ) : emptyPantry ? (
        <View style={S.onboardCardStyle}>
          <Text style={{ fontSize: D.body, fontWeight: D.weightSemibold, color: D.label }}>
            先建立你的冰箱
          </Text>
          <Text
            style={{
              fontSize: D.footnote,
              color: D.labelSecondary,
              lineHeight: 1.5,
              marginTop: 6,
            }}
          >
            录入后可以按食材匹配、预警临期、一键加购
          </Text>
          <View style={{ display: 'flex', flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <View
              className="tap-scale"
              style={{
                flex: 1,
                height: 40,
                borderRadius: 999,
                backgroundColor: D.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => Taro.switchTab({ url: '/pages/pantry/index' })}
            >
              <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: '#fff' }}>
                去填冰箱
              </Text>
            </View>
            <View
              className="tap-scale"
              style={{
                flex: 1,
                height: 40,
                borderRadius: 999,
                backgroundColor: D.bgElevated,
                border: `0.5px solid ${D.separator}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={handleRandom}
            >
              <Text style={{ fontSize: D.subheadline, fontWeight: D.weightMedium, color: D.label }}>
                先看推荐
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* 今日推荐 */}
      <View style={S.recipesSectionStyle}>
        <View style={S.sectionHeaderStyle}>
          <Text style={S.sectionTitleStyle}>今日推荐</Text>
          <Text style={S.sectionLeadStyle}>{recommendation.reason}</Text>
          <View style={S.sectionMetaRowStyle}>
            <Text style={S.sectionMetaTextStyle}>
              {weather
                ? `${weather.temperature}°C · 已按实时天气调整`
                : '按家常口味与评分排序，开启天气后会参考气温冷热'}
            </Text>
            <View style={S.sectionActionsStyle}>
              {!weather && (
                <Text
                  className="tap-scale"
                  style={S.sectionActionStyle}
                  onClick={enableWeather}
                >
                  {weatherLoading ? '获取中…' : '开启天气'}
                </Text>
              )}
              <Text
                className="tap-scale"
                style={S.sectionActionStyle}
                onClick={() => setListVariant((v) => v + 1)}
              >
                换一批
              </Text>
              <Text
                className="tap-scale"
                style={S.sectionActionStyle}
                onClick={handleRandom}
              >
                更多
              </Text>
            </View>
          </View>
        </View>

        <ScrollView scrollX showScrollbar={false} style={S.recommendScrollStyle}>
          {recommendation.recipes.map((raw, idx) => {
            const item = enrichRecipeMedia({ ...raw, source: raw.source ?? 'local' })
            return (
              <View
                key={`rec-${String(item.id)}-${idx}`}
                className="tap-scale"
                style={S.recommendCardStyle}
                onClick={() => handleCardClick(item)}
              >
                <View style={S.recommendThumbStyle}>
                  {item.image ? (
                    <Image
                      src={item.image}
                      mode="aspectFill"
                      style={{ width: '100%', height: '100%' }}
                      lazyLoad
                    />
                  ) : (
                    <Text style={{ fontSize: 40 }}>{item.emoji || '🥘'}</Text>
                  )}
                </View>
                <Text style={S.recommendTitleStyle}>{item.title}</Text>
                <Text style={S.recommendMetaStyle}>
                  {item.time ? `${item.time} 分钟` : '家常'} · {item.difficulty || '简单'}
                </Text>
              </View>
            )
          })}
        </ScrollView>
      </View>

      <VoiceRecorderSheet
        visible={showVoice}
        onClose={() => setShowVoice(false)}
        onRecorded={handleVoiceRecorded}
        onTranscribed={handleVoiceTranscribed}
      />
    </View>
  )
}

export default observer(Index)
