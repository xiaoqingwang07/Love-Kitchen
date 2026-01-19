import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'

export default function Result() {
    const [recipes, setRecipes] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const router = useRouter()

    useEffect(() => {
        const { auto, ingredients } = router.params
        const decodedIngredients = ingredients ? decodeURIComponent(ingredients) : ''

        if (auto === 'true' && decodedIngredients) {
            fetchAI(decodedIngredients)
        } else {
            // Mock Data Enhanced
            setRecipes([
                {
                    id: 1, title: '增肌鸡胸肉沙拉', quote: '低脂高蛋白，跑完来一碗！', rating: 4.8, count: 1204, emoji: '🥗',
                    ingredients: [{ name: '鸡胸肉', amount: '200g' }, { name: '生菜', amount: '100g' }, { name: '西红柿', amount: '1个' }],
                    steps: ['鸡胸肉煮熟撕碎', '蔬菜切洗干净', '加入油醋汁拌匀'],
                    nutritionAnalysis: '高蛋白低卡路里，非常适合庆爷跑后修复肌肉纤维。'
                },
                {
                    id: 2, title: '快手牛肉炒意面', quote: '碳水与肉的完美结合', rating: 4.9, count: 850, emoji: '🍝',
                    ingredients: [{ name: '牛排', amount: '150g' }, { name: '意面', amount: '100g' }, { name: '黑胡椒', amount: '适量' }],
                    steps: ['意面煮8分钟捞出', '牛排切条煎熟', '混合翻炒加入黑胡椒'],
                    nutritionAnalysis: '提供优质的慢碳水和红肉蛋白，为下一次长距离训练储备糖原。'
                }
            ])
        }
    }, [router.params])

    const fetchAI = async (ingredientsStr: string) => {
        setIsLoading(true)
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
                            content: `你是一个五星级AI主厨和运动营养专家。请根据食材推荐 3 道适合【庆爷】（资深跑者）的菜谱。
                            必须返回纯 JSON 数组。结构如下：
                            [
                                { 
                                    "title": "菜名", 
                                    "quote": "一句话点评", 
                                    "rating": 4.8, 
                                    "count": 1024, 
                                    "emoji": "🥘",
                                    "ingredients": [{"name": "食材1", "amount": "克数"}, ...],
                                    "steps": ["步骤1...", "步骤2..."],
                                    "nutritionAnalysis": "针对跑者的营养分析..." 
                                }
                            ]
                            `
                        },
                        {
                            role: "user",
                            content: `食材：${ingredientsStr}。`
                        }
                    ],
                    temperature: 1.3
                }
            })

            let content = response.data.choices[0].message.content
            content = content.replace(/```json/g, '').replace(/```/g, '').trim()
            const data = JSON.parse(content)

            if (Array.isArray(data)) {
                setRecipes(data)
            } else {
                setRecipes([data])
            }

        } catch (error) {
            console.error('AI Error', error)
            Taro.showToast({ title: 'AI 繁忙，加载推荐', icon: 'none' })
        } finally {
            setIsLoading(false)
        }
    }

    const goToDetail = (item: any) => {
        Taro.setStorageSync('selectedRecipeDetail', item)
        Taro.navigateTo({ url: '/pages/detail/index' })
    }

    // --- Inline Styles ---
    const S = {
        page: {
            minHeight: '100vh',
            backgroundColor: '#f9fafb',
            padding: '20px',
            boxSizing: 'border-box'
        } as React.CSSProperties,

        header: {
            marginBottom: '24px'
        } as React.CSSProperties,

        title: {
            fontSize: '20px',
            fontWeight: '800',
            color: '#111827',
            marginBottom: '4px',
            display: 'block'
        } as React.CSSProperties,

        subtitle: {
            fontSize: '13px',
            color: '#6b7280'
        } as React.CSSProperties,

        listContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            paddingBottom: '40px'
        } as React.CSSProperties,

        card: {
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            border: '1px solid #f3f4f6'
        } as React.CSSProperties,

        imgBox: {
            width: '80px',
            height: '80px',
            backgroundColor: '#fff7ed',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px'
        } as React.CSSProperties,

        infoBox: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
        } as React.CSSProperties,

        cardTitle: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '6px'
        } as React.CSSProperties,

        quote: {
            fontSize: '12px',
            color: '#ea580c',
            fontStyle: 'italic',
            marginBottom: '8px',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
        } as React.CSSProperties as any,

        metaRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        } as React.CSSProperties,

        ratingBadge: {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#fef3c7',
            padding: '2px 8px',
            borderRadius: '6px'
        } as React.CSSProperties,

        star: {
            fontSize: '12px',
            color: '#d97706'
        } as React.CSSProperties,

        rateVal: {
            fontSize: '12px',
            fontWeight: '700',
            color: '#b45309'
        } as React.CSSProperties,

        countText: {
            fontSize: '12px',
            color: '#9ca3af'
        } as React.CSSProperties
    }

    if (isLoading) {
        return (
            <View style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', backgroundColor: '#fff' }}>
                <Text style={{ fontSize: '48px', marginBottom: '20px' }}>👨‍🍳</Text>
                <Text style={{ color: '#6b7280', fontSize: '15px', fontWeight: 'bold' }}>AI 主厨正在为庆爷定制菜谱...</Text>
            </View>
        )
    }

    return (
        <View style={S.page}>
            <View style={S.header}>
                <Text style={S.title}>为您推荐</Text>
                <Text style={S.subtitle}>根据库存为庆爷定制的 {recipes.length} 道美味</Text>
            </View>

            <View style={S.listContainer}>
                {recipes.map((item, idx) => (
                    <View key={idx} style={S.card} onClick={() => goToDetail(item)}>
                        <View style={S.imgBox}>
                            <Text>{item.emoji || item.image || '🥘'}</Text>
                        </View>
                        <View style={S.infoBox}>
                            <Text style={S.cardTitle}>{item.title}</Text>
                            <Text style={S.quote}>“{item.quote}”</Text>
                            <View style={S.metaRow}>
                                <View style={S.ratingBadge}>
                                    <Text style={S.star}>★</Text>
                                    <Text style={S.rateVal}>{item.rating || 4.5}</Text>
                                </View>
                                <Text style={S.countText}>{item.count ? `${item.count}人跟练` : '新品'}</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    )
}