import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'

const FAVORITES_KEY = 'favoriteRecipes'
const FAVORITE_DETAILS_KEY = 'favoriteRecipeDetails'

export default function Favorites() {
    const [favorites, setFavorites] = useState<any[]>([])
    const [isEmpty, setIsEmpty] = useState(true)

    useEffect(() => {
        loadFavorites()
    }, [])

    const loadFavorites = () => {
        try {
            // 加载收藏的详细信息
            const details = Taro.getStorageSync(FAVORITE_DETAILS_KEY)
            const favList = Taro.getStorageSync(FAVORITES_KEY)
            
            if (details && Array.isArray(details) && favList && Array.isArray(favList)) {
                // 过滤出收藏的菜谱
                const favDetails = details.filter((item: any) => 
                    favList.includes(item.id)
                )
                setFavorites(favDetails)
                setIsEmpty(favDetails.length === 0)
            } else {
                setIsEmpty(true)
            }
        } catch (e) {
            setIsEmpty(true)
        }
    }

    const removeFavorite = (id: number) => {
        const favList = Taro.getStorageSync(FAVORITES_KEY) || []
        const newFavList = (favList as number[]).filter(fid => fid !== id)
        Taro.setStorageSync(FAVORITES_KEY, newFavList)
        
        // 更新详情
        const details = Taro.getStorageSync(FAVORITE_DETAILS_KEY) || []
        const newDetails = (details as any[]).filter((_: any, idx: number) => 
            !newFavList.includes(id)
        )
        Taro.setStorageSync(FAVORITE_DETAILS_KEY, newDetails)
        
        loadFavorites()
        Taro.showToast({ title: '已取消收藏', icon: 'none' })
    }

    const goToDetail = (item: any) => {
        Taro.setStorageSync('selectedRecipeDetail', item)
        Taro.navigateTo({ url: '/pages/detail/index' })
    }

    // --- Styles ---
    const S = {
        page: {
            minHeight: '100vh',
            backgroundColor: '#fafafa',
            padding: '20px',
            paddingBottom: '40px'
        } as React.CSSProperties,

        header: {
            marginBottom: '24px'
        } as React.CSSProperties,

        title: {
            fontSize: '24px',
            fontWeight: '700',
            color: '#1a1a2e',
            display: 'block'
        } as React.CSSProperties,

        emptyBox: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '100px'
        } as React.CSSProperties,

        emptyEmoji: {
            fontSize: '64px',
            marginBottom: '20px'
        } as React.CSSProperties,

        emptyTitle: {
            fontSize: '18px',
            fontWeight: '600',
            color: '#1a1a2e',
            marginBottom: '8px'
        } as React.CSSProperties,

        emptyDesc: {
            fontSize: '14px',
            color: '#aeaeb2',
            textAlign: 'center' as const
        } as React.CSSProperties,

        list: {
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
        } as React.CSSProperties,

        card: {
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
        } as React.CSSProperties,

        imgBox: {
            width: '64px',
            height: '64px',
            backgroundColor: '#fff7ed',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
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

        cardDesc: {
            fontSize: '13px',
            color: '#8e8e93',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
        } as React.CSSProperties,

        removeBtn: {
            padding: '8px',
            fontSize: '18px',
            backgroundColor: 'transparent',
            border: 'none'
        } as React.CSSProperties
    }

    if (isEmpty) {
        return (
            <View style={S.page}>
                <View style={S.header}>
                    <Text style={S.title}>我的收藏</Text>
                </View>
                <View style={S.emptyBox}>
                    <Text style={S.emptyEmoji}>💔</Text>
                    <Text style={S.emptyTitle}>还没有收藏</Text>
                    <Text style={S.emptyDesc}>看到喜欢的菜谱就收藏起来吧~</Text>
                </View>
            </View>
        )
    }

    return (
        <View style={S.page}>
            <View style={S.header}>
                <Text style={S.title}>我的收藏 ({favorites.length})</Text>
            </View>

            <View style={S.list}>
                {favorites.map((item: any, idx: number) => (
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
                            <Text style={S.cardDesc}>{item.quote || item.nutritionAnalysis || '点击查看详情'}</Text>
                        </View>
                        <View 
                            style={S.removeBtn}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (item.id) removeFavorite(item.id)
                            }}
                        >
                            <Text>❤️</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    )
}
