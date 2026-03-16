import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo } from 'react'
import './index.scss'

// 收藏 storage key
const FAVORITES_KEY = 'favoriteRecipes'

export default function Index() {
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // 自动填充（从冰箱页带过来的）
    useDidShow(() => {
        const autoSearch = Taro.getStorageSync('autoSearchIngredient')
        if (autoSearch) {
            setInputValue(autoSearch)
            Taro.removeStorageSync('autoSearchIngredient')
        }
    })

    // 推荐的固定菜谱卡片
    const recommendedRecipes = useMemo(() => [
        { 
            id: 1, 
            title: '增肌鸡胸沙拉', 
            calories: '450', 
            tag: '跑者首选', 
            emoji: '🥗',
            color: 'from-orange-300 to-rose-400'
        },
        { 
            id: 2, 
            title: '香煎三文鱼', 
            calories: '520', 
            tag: '优质蛋白', 
            emoji: '🐟',
            color: 'from-blue-300 to-indigo-400'
        },
        { 
            id: 3, 
            title: '牛油果吐司', 
            calories: '300', 
            tag: '低卡饱腹', 
            emoji: '🥑',
            color: 'from-emerald-300 to-teal-400'
        },
        { 
            id: 4, 
            title: '香蕉奶昔', 
            calories: '200', 
            tag: '快速补给', 
            emoji: '🥛',
            color: 'from-yellow-300 to-amber-400'
        },
    ], [])

    // 获取 API Key
    const getApiKey = (): string => {
        return Taro.getStorageSync('DEEPSEEK_API_KEY') || '';
    }

    // 安全的 JSON 解析
    const safeParseJSON = (str: string): any => {
        try {
            const match = str.match(/\{[\s\S]*\}/);
            if (match) {
                return JSON.parse(match[0]);
            }
            return JSON.parse(str);
        } catch (e) {
            console.error('JSON parse failed:', e);
            return null;
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
                            content: "你是一个专业的运动营养师和五星级大厨。请根据用户提供的食材，结合【跑者恢复】的营养需求，推荐一道最合适的菜。必须只返回纯 JSON 格式数据。JSON 格式要求：{ \"title\": \"菜名\", \"reason\": \"推荐理由（一句话）\", \"highlights\": [\"营养亮点1\", \"营养亮点2\", \"营养亮点3\"], \"steps\": [\"步骤1\", \"步骤2\", \"步骤3\"] }"
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

            Taro.setStorageSync('currentRecipe', recipeData)
            Taro.hideLoading()

            Taro.navigateTo({
                url: `/pages/result/index?from=ai&ingredients=${encodeURIComponent(inputValue)}`
            })

        } catch (error: any) {
            console.error('API Error:', error)
            Taro.hideLoading()
            
            let errMsg = 'AI 厨师可能累了，请重试或检查网络'
            if (error.errMsg) {
                errMsg += '\n' + error.errMsg
            }
            
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
        Taro.showToast({ title: '功能开发中~', icon: 'none' })
    }

    const handleCardClick = (item: any) => {
        Taro.setStorageSync('selectedRecipe', item)
        // 跳转到 result 页面（传入固定菜谱的 ID）
        Taro.navigateTo({
            url: `/pages/result/index?from=preset&id=${item.id}`
        })
    }

    // 点击跑者卡片
    const handleRunnerClick = () => {
        // 引导用户输入食材
        Taro.showModal({
            title: '🏃 黄金30分钟',
            content: '输入你冰箱里的食材，我帮你搭配最适合跑后恢复的餐！',
            confirmText: '好的',
            showCancel: false
        })
    }

    return (
        <View className='index-page'>
            {/* Header */}
            <View className='header'>
                <Text className='greeting'>你好 👋</Text>
                <Text className='subtitle'>今天想吃点啥？</Text>
            </View>

            {/* Search Bar */}
            <View className='search-section'>
                <View className='search-bar'>
                    <Text className='search-icon'>🔍</Text>
                    <Input
                        className='search-input'
                        placeholder='冰箱里有啥？'
                        placeholderClass='placeholder'
                        value={inputValue}
                        onInput={(e) => setInputValue(e.detail.value)}
                        confirmType='search'
                        onConfirm={handleGenerate}
                        disabled={isLoading}
                    />
                    <View 
                        className='mic-btn'
                        onClick={() => {
                            Taro.showToast({ title: '语音功能开发中~', icon: 'none' })
                        }}
                    >
                        <Text>🎤</Text>
                    </View>
                </View>
            </View>

            {/* Runner Section - Clickable */}
            <View className='runner-section'>
                <View className='runner-card' onClick={handleRunnerClick}>
                    <View className='runner-info'>
                        <View className='runner-tag'>
                            <Text>🏃 跑者专属</Text>
                        </View>
                        <Text className='runner-title'>黄金30分钟</Text>
                        <Text className='runner-desc'>训练后补充 3:1 碳水蛋白比，推荐鸡胸肉沙拉</Text>
                        <View className='runner-arrow'>
                            <Text>→</Text>
                        </View>
                    </View>
                    <View className='runner-visual'>
                        <View className='circle c1'></View>
                        <View className='circle c2'></View>
                        <View className='circle c3'></View>
                    </View>
                </View>
            </View>

            {/* Recipes Section */}
            <View className='recipes-section'>
                <View className='section-header'>
                    <Text className='section-title'>为你推荐</Text>
                    <Text className='section-more' onClick={handleRandom}>换一批 →</Text>
                </View>
                
                <ScrollView
                    scrollX={true}
                    className='recipe-scroll'
                    enableFlex
                    showScrollbar={false}
                >
                    <View className='recipe-list'>
                        {recommendedRecipes.map((item) => (
                            <View 
                                key={item.id} 
                                className={`recipe-card ${item.color}`}
                                onClick={() => handleCardClick(item)}
                            >
                                <View className='recipe-emoji-bg'>
                                    <Text className='recipe-emoji'>{item.emoji}</Text>
                                </View>
                                <View className='recipe-content'>
                                    <Text className='recipe-title'>{item.title}</Text>
                                    <View className='recipe-meta'>
                                        <Text className='recipe-tag'>{item.tag}</Text>
                                        <Text className='recipe-cal'>{item.calories} kcal</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Quick Actions */}
            <View className='actions-section'>
                <View className='action-item' onClick={handleClearFridge}>
                    <View className='action-emoji'>📷</View>
                    <Text className='action-text'>清冰箱</Text>
                </View>
                <View className='action-item' onClick={handleRandom}>
                    <View className='action-emoji'>🎲</View>
                    <Text className='action-text'>随机</Text>
                </View>
                <View className='action-item' onClick={handleFavorites}>
                    <View className='action-emoji'>❤️</View>
                    <Text className='action-text'>收藏</Text>
                </View>
            </View>
        </View>
    )
}
