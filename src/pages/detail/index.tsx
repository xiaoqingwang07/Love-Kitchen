import { View, Text, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'

export default function Detail() {
    const [recipe, setRecipe] = useState<any>(null)

    useLoad(() => {
        const data = Taro.getStorageSync('selectedRecipeDetail')
        if (data) {
            setRecipe(data)
        }
    })

    const handleStartCooking = () => {
        Taro.showToast({ title: '开始烹饪！', icon: 'success' })
        setTimeout(() => {
            Taro.switchTab({ url: '/pages/index/index' })
        }, 1500)
    }

    // --- INLINE STYLES ---
    const S = {
        page: {
            minHeight: '100vh',
            backgroundColor: '#ffffff',
            paddingBottom: '100px'
        } as React.CSSProperties,

        heroSection: {
            width: '100%',
            height: '240px',
            backgroundColor: '#fff7ed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
        } as React.CSSProperties,

        heroEmoji: {
            fontSize: '80px'
        } as React.CSSProperties,

        heroTitleOverlay: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
            padding: '40px 20px 20px',
            boxSizing: 'border-box'
        } as React.CSSProperties,

        title: {
            color: 'white',
            fontSize: '24px',
            fontWeight: '800',
            marginBottom: '4px',
            display: 'block'
        } as React.CSSProperties,

        tagsRow: {
            display: 'flex',
            gap: '8px'
        } as React.CSSProperties,

        tag: {
            backgroundColor: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(4px)',
            color: 'white',
            fontSize: '12px',
            padding: '2px 8px',
            borderRadius: '4px'
        } as React.CSSProperties,

        section: {
            padding: '24px 20px'
        } as React.CSSProperties,

        sectionTitle: {
            fontSize: '18px',
            fontWeight: '800',
            color: '#1f2937',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        } as React.CSSProperties,

        ingGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
        } as React.CSSProperties,

        ingItem: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #f3f4f6'
        } as React.CSSProperties,

        ingName: {
            fontSize: '14px',
            color: '#374151',
            fontWeight: '600'
        } as React.CSSProperties,

        ingAmount: {
            fontSize: '14px',
            color: '#9ca3af'
        } as React.CSSProperties,

        stepItem: {
            marginBottom: '24px',
            display: 'flex',
            gap: '16px'
        } as React.CSSProperties,

        stepNum: {
            width: '28px',
            height: '28px',
            backgroundColor: '#0f172a',
            color: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            flexShrink: 0
        } as React.CSSProperties,

        stepContent: {
            flex: 1
        } as React.CSSProperties,

        stepText: {
            fontSize: '15px',
            color: '#4b5563',
            lineHeight: '1.6',
            marginBottom: '8px',
            display: 'block'
        } as React.CSSProperties,

        nutritionBox: {
            backgroundColor: '#ecfdf5',
            padding: '16px',
            borderRadius: '12px',
            marginTop: '10px'
        } as React.CSSProperties,

        nutritionTitle: {
            color: '#059669',
            fontWeight: 'bold',
            fontSize: '14px',
            marginBottom: '4px',
            display: 'block'
        } as React.CSSProperties,

        nutritionDesc: {
            color: '#047857',
            fontSize: '13px',
            lineHeight: '1.4'
        } as React.CSSProperties,

        btnWrapper: {
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            padding: '16px 20px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid #f3f4f6',
            boxSizing: 'border-box'
        } as React.CSSProperties,

        cookBtn: {
            backgroundColor: '#f97316',
            color: 'white',
            height: '50px',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '16px',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
            border: 'none'
        } as React.CSSProperties
    }

    if (!recipe) return <View>Loading...</View>

    return (
        <View style={S.page}>
            {/* Hero Image */}
            <View style={S.heroSection}>
                <Text style={S.heroEmoji}>{recipe.image || recipe.emoji || '🥘'}</Text>
                <View style={S.heroTitleOverlay}>
                    <Text style={S.title}>{recipe.title}</Text>
                    <View style={S.tagsRow}>
                        <View style={S.tag}>{recipe.time || '15分钟'}</View>
                        <View style={S.tag}>{recipe.calories || '400kcal'}</View>
                    </View>
                </View>
            </View>

            {/* Ingredients */}
            <View style={S.section}>
                <Text style={S.sectionTitle}>
                    <Text>🥕</Text> 用料清单
                </Text>
                <View style={S.ingGrid}>
                    {recipe.ingredients && recipe.ingredients.map((ing: any, idx: number) => (
                        <View key={idx} style={S.ingItem}>
                            <Text style={S.ingName}>{ing.name}</Text>
                            <Text style={S.ingAmount}>{ing.amount}</Text>
                        </View>
                    ))}
                    {(!recipe.ingredients || recipe.ingredients.length === 0) && (
                        <Text style={{ color: '#999', fontSize: 13 }}>AI生成中，请参考步骤描述...</Text>
                    )}
                </View>
            </View>

            {/* Steps */}
            <View style={S.section}>
                <Text style={S.sectionTitle}>
                    <Text>👨‍🍳</Text> 步骤拆解
                </Text>
                {recipe.steps && recipe.steps.map((step: string, idx: number) => (
                    <View key={idx} style={S.stepItem}>
                        <View style={S.stepNum}>{idx + 1}</View>
                        <View style={S.stepContent}>
                            <Text style={S.stepText}>{step}</Text>
                        </View>
                    </View>
                ))}

                {/* Nutrition */}
                {recipe.nutritionAnalysis && (
                    <View style={S.nutritionBox}>
                        <Text style={S.nutritionTitle}>庆爷专属营养分析</Text>
                        <Text style={S.nutritionDesc}>{recipe.nutritionAnalysis}</Text>
                    </View>
                )}
            </View>

            {/* Start Button */}
            <View style={S.btnWrapper}>
                <Button style={S.cookBtn} onClick={handleStartCooking}>
                    🍽️ 开始烹饪
                </Button>
            </View>
        </View>
    )
}
