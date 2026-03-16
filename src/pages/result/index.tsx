import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState, useMemo } from 'react'

// 收藏 storage key
const FAVORITES_KEY = 'favoriteRecipes'

// 本地默认推荐（兜底数据）
const DEFAULT_RECIPES = [
    {
        id: 1,
        title: '增肌鸡胸肉沙拉',
        quote: '低脂高蛋白，跑完来一碗！',
        rating: 4.8,
        count: 1204,
        emoji: '🥗',
        ingredients: [
            { name: '鸡胸肉', amount: '200g' },
            { name: '生菜', amount: '100g' },
            { name: '西红柿', amount: '1个' },
            { name: '橄榄油', amount: '1勺' }
        ],
        steps: ['鸡胸肉煮熟撕碎', '蔬菜切洗', '加入油醋汁拌匀'],
        nutritionAnalysis: '高蛋白低卡，非常适合跑后修复肌肉纤维。'
    },
    {
        id: 2,
        title: '快手牛肉炒意面',
        quote: '碳水与肉的完美结合',
        rating: 4.9,
        count: 850,
        emoji: '🍝',
        ingredients: [
            { name: '牛排', amount: '150g' },
            { name: '意面', amount: '100g' },
            { name: '黑胡椒', amount: '适量' }
        ],
        steps: ['意面煮8分钟捞出', '牛排切条煎熟', '混合翻炒'],
        nutritionAnalysis: '提供优质碳水和蛋白，为下一次长距离训练储备糖原。'
    },
    {
        id: 3,
        title: '番茄鸡蛋汤',
        quote: '简单快手，暖胃首选',
        rating: 4.7,
        count: 2100,
        emoji: '🍅',
        ingredients: [
            { name: '鸡蛋', amount: '2个' },
            { name: '西红柿', amount: '2个' },
            { name: '葱', amount: '适量' }
        ],
        steps: ['西红柿切块', '打散鸡蛋', '煮沸后倒入蛋液'],
        nutritionAnalysis: '易消化吸收，补水又补电解质。'
    }
]

// 类型定义
interface Recipe {
    id?: number
    title: string
    quote?: string
    rating?: number
    count?: number
    emoji?: string
    image?: string
    ingredients?: { name: string; amount: string }[]
    steps?: string[]
    nutritionAnalysis?: string
    isFavorite?: boolean
}

// 安全的 JSON 解析
const safeParseJSON = (str: string): Recipe[] | null => {
    try {
        // 尝试提取 JSON 数组
        const match = str.match(/\[[\s\S]*\]/);
        if (match) {
            return JSON.parse(match[0]);
        }
        return JSON.parse(str);
    } catch (e) {
        console.error('JSON parse failed:', e);
        return null;
    }
};

// 获取 API Key
const getApiKey = (): string => {
    return Taro.getStorageSync('DEEPSEEK_API_KEY') || '';
};

export default function Result() {
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>('')
    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    const router = useRouter()

    // 加载收藏状态
    const loadFavorites = (): number[] => {
        try {
            const fav = Taro.getStorageSync(FAVORITES_KEY);
            return Array.isArray(fav) ? fav : [];
        } catch {
            return [];
        }
    }

    // 检查是否已收藏
    const checkFavorite = (recipeId: number): boolean => {
        const favs = loadFavorites();
        return favs.includes(recipeId);
    }

    useEffect(() => {
        const { auto, ingredients, from } = router.params
        const decodedIngredients = ingredients ? decodeURIComponent(ingredients) : ''

        if (auto === 'true' && decodedIngredients) {
            fetchAI(decodedIngredients)
        } else if (from === 'random') {
            fetchRandom()
        } else {
            // 加载默认推荐
            setRecipes(DEFAULT_RECIPES.map(r => ({
                ...r,
                isFavorite: checkFavorite(r.id || 0)
            })))
        }
    }, [router.params])

    // AI 推荐
    const fetchAI = async (ingredientsStr: string) => {
        setIsLoading(true)
        setError('')
        
        const apiKey = getApiKey()
        
        if (!apiKey) {
            setError('请先在设置中添加 DeepSeek API Key')
            setIsLoading(false)
            // 仍然显示默认推荐
            setRecipes(DEFAULT_RECIPES.map(r => ({
                ...r,
                isFavorite: checkFavorite(r.id || 0)
            })))
            return
        }

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
                            content: `你是一个五星级AI主厨和运动营养专家。请根据食材推荐 3 道适合【跑步爱好者】的菜谱。
                            必须返回纯 JSON 数组格式。结构如下（严格按照这个格式）：
                            [
                                { 
                                    "title": "菜名", 
                                    "quote": "一句话点评", 
                                    "rating": 4.8, 
                                    "count": 1024, 
                                    "emoji": "🥘",
                                    "ingredients": [{"name": "食材1", "amount": "用量"}, ...],
                                    "steps": ["步骤1...", "步骤2..."],
                                    "nutritionAnalysis": "针对跑者的营养分析..." 
                                }
                            ]
                            只返回 JSON，不要任何其他文字。`
                        },
                        {
                            role: "user",
                            content: `食材：${ingredientsStr}。请推荐3道适合跑步后补充能量的菜。`
                        }
                    ],
                    temperature: 1.0,
                    max_tokens: 1500
                }
            })

            if (response.statusCode !== 200) {
                throw new Error(`API 返回错误: ${response.statusCode}`)
            }

            const content = response.data.choices?.[0]?.message?.content
            
            if (!content) {
                throw new Error('API 返回为空')
            }

            const data = safeParseJSON(content)

            if (!data || !Array.isArray(data) || data.length === 0) {
                throw new Error('无法解析菜谱数据')
            }

            // 添加 ID 和收藏状态
            const recipesWithMeta = data.map((r: Recipe, idx: number) => ({
                ...r,
                id: Date.now() + idx,
                isFavorite: false
            }))

            setRecipes(recipesWithMeta)

        } catch (err: any) {
            console.error('AI Error:', err)
            setError('AI 暂时繁忙，已为你推荐热门菜谱')
            // 使用默认推荐作为兜底
            setRecipes(DEFAULT_RECIPES.map(r => ({
                ...r,
                isFavorite: checkFavorite(r.id || 0)
            })))
        } finally {
            setIsLoading(false)
        }
    }

    // 随机推荐
    const fetchRandom = () => {
        // 随机打乱默认推荐
        const shuffled = [...DEFAULT_RECIPES].sort(() => Math.random() - 0.5)
        setRecipes(shuffled.map(r => ({
            ...r,
            isFavorite: checkFavorite(r.id || 0)
        })))
    }

    // 切换收藏
    const toggleFavorite = (recipe: Recipe) => {
        if (!recipe.id) return

        const favs = loadFavorites()
        let newFavs: number[]

        if (favs.includes(recipe.id)) {
            newFavs = favs.filter(id => id !== recipe.id)
            Taro.showToast({ title: '已取消收藏', icon: 'none' })
        } else {
            newFavs = [...favs, recipe.id]
            Taro.showToast({ title: '收藏成功 ❤️', icon: 'none' })
            
            // 同时保存详细信息
            try {
                const details = Taro.getStorageSync('favoriteRecipeDetails') || []
                const newDetails = [...(details as any[]), { ...recipe, savedAt: Date.now() }]
                Taro.setStorageSync('favoriteRecipeDetails', newDetails)
            } catch (e) {
                console.error('Save favorite details failed:', e)
            }
        }

        Taro.setStorageSync(FAVORITES_KEY, newFavs)

        // 更新当前列表的收藏状态
        setRecipes(prev => prev.map(r => 
            r.id === recipe.id ? { ...r, isFavorite: !r.isFavorite } : r
        ))
    }

    const goToDetail = (item: Recipe) => {
        Taro.setStorageSync('selectedRecipeDetail', item)
        Taro.navigateTo({ url: '/pages/detail/index' })
    }

    // --- Inline Styles ---
    const S = useMemo(() => ({
        page: {
            minHeight: '100vh',
            backgroundColor: '#fafafa',
            padding: '20px',
            paddingBottom: '100px',
            boxSizing: 'border-box'
        } as React.CSSProperties,

        header: {
            marginBottom: '20px'
        } as React.CSSProperties,

        title: {
            fontSize: '22px',
            fontWeight: '700',
            color: '#1a1a2e',
            marginBottom: '4px',
            display: 'block'
        } as React.CSSProperties,

        subtitle: {
            fontSize: '14px',
            color: '#8e8e93'
        } as React.CSSProperties,

        errorBox: {
            backgroundColor: '#fff7ed',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '16px',
            borderLeft: '3px solid #ff9a56'
        } as React.CSSProperties,

        errorText: {
            fontSize: '14px',
            color: '#ea580c'
        } as React.CSSProperties,

        listContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            paddingBottom: '40px'
        } as React.CSSProperties,

        card: {
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.02)'
        } as React.CSSProperties,

        imgBox: {
            width: '72px',
            height: '72px',
            backgroundColor: '#fff7ed',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            flexShrink: 0
        } as React.CSSProperties,

        infoBox: {
            flex: 1,
            minWidth: 0
        } as React.CSSProperties,

        cardTitle: {
            fontSize: '16px',
            fontWeight: '600',
            color: '#1a1a2e',
            marginBottom: '4px',
            display: 'block'
        } as React.CSSProperties,

        quote: {
            fontSize: '13px',
            color: '#ff9a56',
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
            gap: '10px'
        } as React.CSSProperties,

        ratingBadge: {
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            backgroundColor: '#fffbeb',
            padding: '2px 8px',
            borderRadius: '6px'
        } as React.CSSProperties,

        star: {
            fontSize: '12px',
            color: '#fbbf24'
        } as React.CSSProperties,

        rateVal: {
            fontSize: '12px',
            fontWeight: '600',
            color: '#d97706'
        } as React.CSSProperties,

        countText: {
            fontSize: '12px',
            color: '#aeaeb2'
        } as React.CSSProperties,

        favBtn: {
            padding: '8px',
            fontSize: '20px',
            backgroundColor: 'transparent',
            border: 'none',
            lineHeight: 1
        } as React.CSSProperties,

        loadingBox: {
            height: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
        } as React.CSSProperties,

        loadingEmoji: {
            fontSize: '48px',
            marginBottom: '16px'
        } as React.CSSProperties,

        loadingText: {
            color: '#8e8e93',
            fontSize: '15px',
            fontWeight: '500'
        } as React.CSSProperties
    }), [])

    if (isLoading) {
        return (
            <View style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <View style={S.loadingBox}>
                    <Text style={S.loadingEmoji}>👨‍🍳</Text>
                    <Text style={S.loadingText}>AI 主厨正在定制菜谱...</Text>
                </View>
            </View>
        )
    }

    return (
        <View style={S.page}>
            <View style={S.header}>
                <Text style={S.title}>为你推荐</Text>
                <Text style={S.subtitle}>{recipes.length} 道适合你的美味</Text>
            </View>

            {/* Error Toast */}
            {error && (
                <View style={S.errorBox}>
                    <Text style={S.errorText}>{error}</Text>
                </View>
            )}

            <View style={S.listContainer}>
                {recipes.map((item, idx) => (
                    <View 
                        key={item.id || idx} 
                        style={S.card} 
                        onClick={() => goToDetail(item)}
                    >
                        <View style={S.imgBox}>
                            <Text>{item.emoji || '🥘'}</Text>
                        </View>
                        <View style={S.infoBox}>
                            <Text style={S.cardTitle}>{item.title}</Text>
                            {item.quote && <Text style={S.quote}>“{item.quote}”</Text>}
                            <View style={S.metaRow}>
                                <View style={S.ratingBadge}>
                                    <Text style={S.star}>★</Text>
                                    <Text style={S.rateVal}>{item.rating || '4.5'}</Text>
                                </View>
                                <Text style={S.countText}>{item.count ? `${item.count}人做过` : '新品'}</Text>
                            </View>
                        </View>
                        <View 
                            style={S.favBtn}
                            onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(item)
                            }}
                        >
                            <Text>{item.isFavorite ? '❤️' : '🤍'}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    )
}
