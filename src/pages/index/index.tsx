import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo } from 'react'
import { DEFAULT_RECIPES } from '../../data/recipes'
import { getSearchHistory, addSearchHistory, clearSearchHistory } from '../../store'
import type { Recipe } from '../../types/recipe'

// 收藏 storage key
const FAVORITES_KEY = 'favoriteRecipes'

export default function Index() {
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // 自动填充（从冰箱页带过来的）
  useDidShow(() => {
    const autoSearch = Taro.getStorageSync('autoSearchIngredient')
    if (autoSearch) {
      setInputValue(autoSearch)
      Taro.removeStorageSync('autoSearchIngredient')
    }
    // 加载搜索历史
    loadSearchHistory()
  })

  const loadSearchHistory = () => {
    try {
      const history = getSearchHistory()
      setSearchHistory(history.map(h => h.keywords))
    } catch (e) {
      console.error('Load history failed:', e)
    }
  }

  // 推荐的固定菜谱卡片
  const recommendedRecipes = useMemo(() => DEFAULT_RECIPES.slice(0, 6), [])

  // 获取 API Key
  const getApiKey = (): string => {
    return Taro.getStorageSync('DEEPSEEK_API_KEY') || ''
  }

  // 安全的 JSON 解析
  const safeParseJSON = (str: string): any => {
    try {
      const match = str.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
      return JSON.parse(str)
    } catch (e) {
      console.error('JSON parse failed:', e)
      return null
    }
  }

  const handleGenerate = async () => {
    if (!inputValue.trim()) {
      Taro.showToast({ title: '先告诉我冰箱里有什么呀~', icon: 'none' })
      return
    }

    const apiKey = getApiKey()
    
    if (!apiKey) {
      Taro.showModal({
        title: '需要 API Key',
        content: '请先在微信小程序右上角设置中配置 DeepSeek API Key',
        confirmText: '知道了',
        showCancel: false
      })
      return
    }

    // 保存搜索历史
    addSearchHistory(inputValue.trim())
    loadSearchHistory()

    setIsLoading(true)
    Taro.showLoading({ title: 'AI 正在构思食谱...' })

    try {
      const response = await Taro.request({
        url: 'https://api.deepseek.com/chat/completions',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        data: {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "你是一个专业的运动营养师和五星级大厨。请根据用户提供的食材，结合【跑者恢复】的营养需求，推荐一道最合适的菜。必须只返回纯 JSON 格式数据。JSON 格式要求：{ \"title\": \"菜名\", \"reason\": \"推荐理由（一句话）\", \"highlights\": [\"营养亮点1\", \"营养亮点2\", \"营养亮点3\"], \"steps\": [\"步骤1\", \"步骤2\", \"步骤3\"], \"ingredients\": [{\"name\": \"食材1\", \"amount\": \"用量\"}], \"time\": 20, \"difficulty\": \"简单\" }"
            },
            {
              role: "user",
              content: `食材：${inputValue}。特别注意：用户是刚结束训练的跑者，急需补充糖原和蛋白质。`
            }
          ],
          temperature: 1.0,
          max_tokens: 800
        }
      })

      if (response.statusCode !== 200) {
        throw new Error(`API 错误: ${response.statusCode}`)
      }

      const aiContent = response.data.choices?.[0]?.message?.content
      
      if (!aiContent) {
        throw new Error('API 返回为空')
      }

      const cleanJson = aiContent.replace(/```json/g, '').replace(/```/g, '').trim()
      const recipeData = safeParseJSON(cleanJson)

      if (!recipeData) {
        throw new Error('无法解析菜谱数据')
      }

      // 构造完整菜谱数据
      const fullRecipe: Recipe = {
        id: Date.now(),
        title: recipeData.title || 'AI 推荐菜',
        quote: recipeData.reason || '',
        emoji: '🍳',
        ingredients: recipeData.ingredients || [],
        steps: (recipeData.steps || []).map((s: string, i: number) => ({ content: s, time: Math.floor(Math.random() * 10) + 5 })),
        nutritionAnalysis: (recipeData.highlights || []).join('；'),
        time: recipeData.time || 20,
        difficulty: recipeData.difficulty || '简单',
        tags: ['🏃 跑者专属'],
        isFavorite: false
      }

      Taro.setStorageSync('currentRecipe', fullRecipe)
      Taro.hideLoading()

      Taro.navigateTo({
        url: `/pages/result/index?from=ai&ingredients=${encodeURIComponent(inputValue)}`
      })

    } catch (error: any) {
      console.error('API Error:', error)
      Taro.hideLoading()
      
      let errMsg = 'AI 厨师可能累了，请重试或检查网络'
      if (error.errMsg) errMsg += '\n' + error.errMsg
      
      Taro.showModal({
        title: '生成失败',
        content: errMsg,
        showCancel: false
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 随机推荐
  const handleRandom = () => {
    Taro.navigateTo({
      url: '/pages/result/index?from=random'
    })
  }

  // 清冰箱
  const handleClearFridge = () => {
    Taro.navigateTo({
      url: '/pages/fridge/index'
    })
  }

  // 收藏页面
  const handleFavorites = () => {
    Taro.switchTab({
      url: '/pages/favorites/index'
    })
  }

  const handleCardClick = (item: Recipe) => {
    Taro.setStorageSync('selectedRecipeDetail', item)
    Taro.navigateTo({
      url: `/pages/result/index?from=preset&id=${item.id}`
    })
  }

  // 点击跑者卡片
  const handleRunnerClick = () => {
    Taro.showModal({
      title: '🏃 黄金30分钟',
      content: '输入你冰箱里的食材，我帮你搭配最适合跑后恢复的餐！',
      confirmText: '好的',
      showCancel: false
    })
  }

  // 点击搜索历史
  const handleHistoryClick = (keyword: string) => {
    setInputValue(keyword)
    setShowHistory(false)
  }

  // 清空历史
  const handleClearHistory = () => {
    clearSearchHistory()
    setSearchHistory([])
    Taro.showToast({ title: '已清空历史', icon: 'none' })
  }

  // ============ Styles ============
  const S = useMemo(() => ({
    page: {
      minHeight: '100vh',
      backgroundColor: '#fafafa',
      paddingBottom: '100px'
    } as React.CSSProperties,
    header: {
      padding: '20px'
    } as React.CSSProperties,
    greeting: {
      fontSize: '14px',
      color: '#8e8e93',
      marginBottom: '4px'
    } as React.CSSProperties,
    subtitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1a1a2e'
    } as React.CSSProperties,
    searchSection: {
      padding: '0 20px 20px'
    } as React.CSSProperties,
    searchBar: {
      backgroundColor: '#fff',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
    } as React.CSSProperties,
    searchIcon: {
      fontSize: '16px',
      marginRight: '10px'
    } as React.CSSProperties,
    searchInput: {
      flex: 1,
      fontSize: '15px',
      color: '#1a1a2e'
    } as React.CSSProperties,
    placeholder: {
      color: '#aeaeb2'
    } as React.CSSProperties,
    micBtn: {
      padding: '8px',
      fontSize: '18px'
    } as React.CSSProperties,
    historyBox: {
      backgroundColor: '#fff',
      borderRadius: '16px',
      margin: '0 20px 20px',
      padding: '16px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
    } as React.CSSProperties,
    historyHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    } as React.CSSProperties,
    historyTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151'
    } as React.CSSProperties,
    clearBtn: {
      fontSize: '13px',
      color: '#8e8e93'
    } as React.CSSProperties,
    historyList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px'
    } as React.CSSProperties,
    historyTag: {
      backgroundColor: '#f3f4f6',
      padding: '6px 12px',
      borderRadius: '8px',
      fontSize: '13px',
      color: '#4b5563'
    } as React.CSSProperties,
    runnerSection: {
      padding: '0 20px 20px'
    } as React.CSSProperties,
    runnerCard: {
      backgroundColor: '#1a1a2e',
      borderRadius: '20px',
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative'
    } as React.CSSProperties,
    runnerInfo: {
      zIndex: 1
    } as React.CSSProperties,
    runnerTag: {
      backgroundColor: 'rgba(249, 115, 22, 0.2)',
      color: '#f97316',
      fontSize: '12px',
      padding: '4px 10px',
      borderRadius: '6px',
      display: 'inline-block',
      marginBottom: '8px'
    } as React.CSSProperties,
    runnerTitle: {
      color: '#fff',
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '4px',
      display: 'block'
    } as React.CSSProperties,
    runnerDesc: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: '13px'
    } as React.CSSProperties,
    runnerVisual: {
      position: 'relative',
      width: '80px',
      height: '80px'
    } as React.CSSProperties,
    circle: {
      position: 'absolute',
      borderRadius: '50%',
      border: '2px solid rgba(249, 115, 22, 0.3)'
    } as React.CSSProperties,
    recipesSection: {
      padding: '0 20px'
    } as React.CSSProperties,
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    } as React.CSSProperties,
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1a1a2e'
    } as React.CSSProperties,
    sectionMore: {
      fontSize: '14px',
      color: '#8e8e93'
    } as React.CSSProperties,
    recipeScroll: {
      marginBottom: '20px'
    } as React.CSSProperties,
    recipeList: {
      display: 'flex',
      gap: '12px',
      paddingBottom: '10px'
    } as React.CSSProperties,
    recipeCard: {
      width: '140px',
      backgroundColor: '#fff',
      borderRadius: '16px',
      padding: '16px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
      flexShrink: 0
    } as React.CSSProperties,
    recipeEmojiBg: {
      width: '48px',
      height: '48px',
      backgroundColor: '#fff7ed',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      marginBottom: '12px'
    } as React.CSSProperties,
    recipeTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1a1a2e',
      marginBottom: '4px',
      display: 'block'
    } as React.CSSProperties,
    recipeTag: {
      fontSize: '12px',
      color: '#8e8e93'
    } as React.CSSProperties,
    actionsSection: {
      display: 'flex',
      justifyContent: 'space-around',
      padding: '20px',
      backgroundColor: '#fff',
      marginTop: '20px',
      borderTop: '1px solid #f3f4f6'
    } as React.CSSProperties,
    actionItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px'
    } as React.CSSProperties,
    actionEmoji: {
      fontSize: '28px'
    } as React.CSSProperties,
    actionText: {
      fontSize: '13px',
      color: '#4b5563'
    } as React.CSSProperties
  }), [])

  return (
    <View style={S.page}>
      {/* Header */}
      <View style={S.header}>
        <Text style={S.greeting}>你好 👋</Text>
        <Text style={S.subtitle}>今天想吃点啥？</Text>
      </View>

      {/* Search Bar */}
      <View style={S.searchSection}>
        <View style={S.searchBar}>
          <Text style={S.searchIcon}>🔍</Text>
          <Input
            className='search-input'
            placeholder='冰箱里有啥？'
            placeholderClass={S.placeholder.className}
            value={inputValue}
            onInput={(e) => setInputValue(e.detail.value)}
            onFocus={() => setShowHistory(true)}
            onConfirm={handleGenerate}
            disabled={isLoading}
          />
          <View style={S.micBtn} onClick={() => Taro.showToast({ title: '语音功能开发中~', icon: 'none' })}>
            <Text>🎤</Text>
          </View>
        </View>
      </View>

      {/* Search History */}
      {showHistory && searchHistory.length > 0 && (
        <View style={S.historyBox}>
          <View style={S.historyHeader}>
            <Text style={S.historyTitle}>最近搜索</Text>
            <Text style={S.clearBtn} onClick={handleClearHistory}>清空</Text>
          </View>
          <View style={S.historyList}>
            {searchHistory.slice(0, 6).map((keyword, idx) => (
              <View key={idx} style={S.historyTag} onClick={() => handleHistoryClick(keyword)}>
                {keyword}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Runner Section */}
      <View style={S.runnerSection}>
        <View style={S.runnerCard} onClick={handleRunnerClick}>
          <View style={S.runnerInfo}>
            <View style={S.runnerTag}><Text>🏃 跑者专属</Text></View>
            <Text style={S.runnerTitle}>黄金30分钟</Text>
            <Text style={S.runnerDesc}>训练后补充 3:1 碳水蛋白比</Text>
          </View>
          <View style={S.runnerVisual}>
            <View style={{ ...S.circle, width: '60px', height: '60px', top: '10px', left: '10px' }} />
            <View style={{ ...S.circle, width: '40px', height: '40px', top: '20px', left: '30px', borderColor: 'rgba(249, 115, 22, 0.5)' }} />
          </View>
        </View>
      </View>

      {/* Recipes Section */}
      <View style={S.recipesSection}>
        <View style={S.sectionHeader}>
          <Text style={S.sectionTitle}>为你推荐</Text>
          <Text style={S.sectionMore} onClick={handleRandom}>换一批 →</Text>
        </View>
        
        <ScrollView scrollX={true} style={S.recipeScroll} enableFlex showScrollbar={false}>
          <View style={S.recipeList}>
            {recommendedRecipes.map((item) => (
              <View key={item.id} style={S.recipeCard} onClick={() => handleCardClick(item)}>
                <View style={S.recipeEmojiBg}><Text>{item.emoji}</Text></View>
                <Text style={S.recipeTitle}>{item.title}</Text>
                <Text style={S.recipeTag}>{item.time}分钟</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Quick Actions */}
      <View style={S.actionsSection}>
        <View style={S.actionItem} onClick={handleClearFridge}>
          <View style={S.actionEmoji}><Text>📷</Text></View>
          <Text style={S.actionText}>清冰箱</Text>
        </View>
        <View style={S.actionItem} onClick={handleRandom}>
          <View style={S.actionEmoji}><Text>🎲</Text></View>
          <Text style={S.actionText}>随机</Text>
        </View>
        <View style={S.actionItem} onClick={handleFavorites}>
          <View style={S.actionEmoji}><Text>❤️</Text></View>
          <Text style={S.actionText}>收藏</Text>
        </View>
      </View>
    </View>
  )
}
