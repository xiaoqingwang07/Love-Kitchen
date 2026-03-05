import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

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

    const recommendedRecipes = [
        { 
            id: 1, 
            title: '增肌鸡胸沙拉', 
            calories: '450', 
            tag: '跑者首选', 
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
            color: 'from-orange-300 to-rose-400'
        },
        { 
            id: 2, 
            title: '香煎三文鱼', 
            calories: '520', 
            tag: '优质蛋白', 
            image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80',
            color: 'from-blue-300 to-indigo-400'
        },
        { 
            id: 3, 
            title: '牛油果吐司', 
            calories: '300', 
            tag: '低卡饱腹', 
            image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&q=80',
            color: 'from-emerald-300 to-teal-400'
        },
        { 
            id: 4, 
            title: '香蕉奶昔', 
            calories: '200', 
            tag: '快速补给', 
            image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&q=80',
            color: 'from-yellow-300 to-amber-400'
        },
    ]

    const handleGenerate = async () => {
        if (!inputValue) {
            Taro.showToast({ title: '先告诉我冰箱里有什么呀~', icon: 'none' })
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
                    'Authorization': 'Bearer ' + Taro.getStorageSync('DEEPSEEK_API_KEY')
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
                    temperature: 1.3
                }
            })

            const aiContent = response.data.choices[0].message.content
            const cleanJson = aiContent.replace(/```json/g, '').replace(/```/g, '').trim()
            const recipeData = JSON.parse(cleanJson)

            Taro.setStorageSync('currentRecipe', recipeData)
            Taro.hideLoading()

            Taro.navigateTo({
                url: `/pages/result/index?from=ai`
            })

        } catch (error) {
            console.error('API Error:', error)
            Taro.hideLoading()
            Taro.showModal({
                title: '生成失败',
                content: 'AI 厨师可能累了，请重试或检查网络。\n' + ((error as any).errMsg || ''),
                showCancel: false
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleCardClick = (item) => {
        Taro.setStorageSync('selectedRecipe', item)
        Taro.navigateTo({
            url: `/pages/detail/index?id=${item.id}`
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
                    />
                    <View className='mic-btn'>
                        <Text>🎤</Text>
                    </View>
                </View>
            </View>

            {/* Runner Section */}
            <View className='runner-section'>
                <View className='runner-card'>
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
                    <Text className='section-more'>查看全部 →</Text>
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
                                <Image 
                                    className='recipe-img' 
                                    src={item.image} 
                                    mode='aspectFill'
                                />
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
                <View className='action-item'>
                    <Text className='action-emoji'>📷</Text>
                    <Text className='action-text'>清冰箱</Text>
                </View>
                <View className='action-item'>
                    <Text className='action-emoji'>🎲</Text>
                    <Text className='action-text'>随机</Text>
                </View>
                <View className='action-item'>
                    <Text className='action-emoji'>❤️</Text>
                    <Text className='action-text'>收藏</Text>
                </View>
            </View>
        </View>
    )
}
