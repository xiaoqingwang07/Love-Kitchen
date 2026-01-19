import { View, Text, Input, ScrollView } from '@tarojs/components'
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
        { id: 1, title: '增肌鸡胸沙拉', calories: '450kcal', tag: '跑者首选', image: '🥗', styleClass: 'card-bg-orange' },
        { id: 2, title: '深海三文鱼排', calories: '520kcal', tag: '优质蛋白', image: '🐟', styleClass: 'card-bg-blue' },
        { id: 3, title: '全麦牛油果塔', calories: '300kcal', tag: '低卡饱腹', image: '🥑', styleClass: 'card-bg-green' },
        { id: 4, title: '能量香蕉奶昔', calories: '200kcal', tag: '快速补给', image: '🍌', styleClass: 'card-bg-yellow' },
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
                    'Authorization': 'Bearer sk-12106abd00cc4fe185b1c3abd30be51e'
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

    return (
        <View className='index-page'>
            {/* Header */}
            <View className='header-title'>
                <Text>爱心厨房</Text>
            </View>

            {/* Capsular Search Bar */}
            <View className='search-container'>
                <View className='search-capsule'>
                    <Text className='search-icon'>🔍</Text>
                    <Input
                        className='search-input'
                        placeholder='今天想吃点什么？'
                        placeholderClass='text-slate-300'
                        value={inputValue}
                        onInput={(e) => setInputValue(e.detail.value)}
                        confirmType='search'
                        onConfirm={handleGenerate}
                    />
                    <View className='search-actions'>
                        <View className='action-icon'>
                            <Text>🎤</Text>
                        </View>
                        <View className='action-icon'>
                            <Text>📷</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Runner Card */}
            <View className='runner-section'>
                <View className='runner-card'>
                    <View className='runner-content'>
                        <View className='runner-header'>
                            <View className='runner-icon-bg'>
                                <Text>🏃‍♂️</Text>
                            </View>
                            <Text className='runner-title'>跑者恢复指南</Text>
                        </View>
                        <Text className='runner-desc'>
                            黄金30分钟：推荐 3:1 碳水蛋白比。
                            <Text className='runner-highlight'>✨ 推荐：鸡胸肉沙拉</Text>
                        </Text>
                    </View>
                    <View className='runner-deco'></View>
                </View>
            </View>

            {/* Horizontal Scroll Recipes */}
            <View className='recipe-section'>
                <Text className='section-title'>推荐食谱</Text>
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
                                className={`recipe-card ${item.styleClass}`}
                                onClick={() => Taro.showToast({ title: `选中: ${item.title}`, icon: 'none' })}
                            >
                                {/* Image Placeholder */}
                                <View className='recipe-image-placeholder'>
                                    <Text className='recipe-emoji'>{item.image}</Text>
                                </View>

                                {/* Overlay */}
                                <View className='recipe-overlay'>
                                    <View className='recipe-info'>
                                        <View>
                                            <Text className='recipe-title'>{item.title}</Text>
                                            <Text className='recipe-tag'>{item.tag}</Text>
                                        </View>
                                        <Text className='recipe-cal'>{item.calories}</Text>
                                    </View>
                                </View>

                                {/* Badge */}
                                <View className='top-badge'>
                                    <Text className='badge-text'>TOP {item.id}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}