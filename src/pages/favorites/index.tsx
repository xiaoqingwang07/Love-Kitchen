import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { getFavoriteDetails, toggleFavorite } from '../../store'
import type { Recipe } from '../../types/recipe'

export default function Favorites() {
  const [favorites, setFavorites] = useState<Recipe[]>([])
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    loadFavorites()
  }, [])

  // 每次显示时重新加载
  useEffect(() => {
    const unsubscribe = Taro.eventCenter.on('onShow', () => {
      loadFavorites()
    })
    return () => Taro.eventCenter.off('onShow', unsubscribe)
  }, [])

  const loadFavorites = () => {
    const details = getFavoriteDetails()
    setFavorites(details)
    setIsEmpty(details.length === 0)
  }

  const removeFavorite = (recipe: Recipe) => {
    toggleFavorite(recipe)
    loadFavorites()
    Taro.showToast({ title: '已取消收藏', icon: 'none' })
  }

  const goToDetail = (item: Recipe) => {
    Taro.setStorageSync('selectedRecipeDetail', item)
    Taro.navigateTo({ url: '/pages/detail/index' })
  }

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#fafafa', padding: '20px', paddingBottom: '40px' }}>
      <View style={{ marginBottom: '24px' }}>
        <Text style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a2e' }}>我的收藏</Text>
      </View>

      {isEmpty ? (
        <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '100px' }}>
          <Text style={{ fontSize: '64px', marginBottom: '20px' }}>💔</Text>
          <Text style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a2e', marginBottom: '8px' }}>还没有收藏</Text>
          <Text style={{ fontSize: '14px', color: '#aeaeb2', textAlign: 'center' }}>看到喜欢的菜谱就收藏起来吧~</Text>
        </View>
      ) : (
        <View style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {favorites.map((item: Recipe, idx: number) => (
            <View 
              key={item.id || idx} 
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
              }}
              onClick={() => goToDetail(item)}
            >
              <View style={{ width: '64px', height: '64px', backgroundColor: '#fff7ed', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                <Text>{item.emoji || '🥘'}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a2e', marginBottom: '4px', display: 'block' }}>{item.title}</Text>
                <Text style={{ fontSize: '13px', color: '#8e8e93', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.quote || item.nutritionAnalysis || '点击查看详情'}</Text>
              </View>
              <View 
                onClick={(e) => {
                  e.stopPropagation()
                  removeFavorite(item)
                }}
                style={{ padding: '8px', fontSize: '18px' }}
              >
                <Text>❤️</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
