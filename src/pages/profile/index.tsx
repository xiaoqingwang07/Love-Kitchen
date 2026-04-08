import { View, Text, Button, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { usePantryStore } from '../../store/context'
import {
  getFavoriteCount,
  getFavoriteDetails,
  getCookedRecipes,
  toggleFavorite,
} from '../../store/storageUtils'
import { STORAGE_KEYS } from '../../store/storageKeys'
import { checkApiKey, getStoredScene, setStoredScene, usesLlmProxy } from '../../api/recipe'
import { enrichRecipeMedia } from '../../utils/enrichRecipeMedia'
import { D } from '../../theme/designTokens'
import * as Com from '../../styles/common'
import type { SceneType } from '../../types/recipe'
import type { Recipe } from '../../types/recipe'
import { getUserStats, getAllAchievements } from '../../utils/achievements'

function Profile() {
  const pantryStore = usePantryStore()
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [cookedRecipes, setCookedRecipes] = useState<(Recipe & { cookedAt: number })[]>([])
  const [dinersCount, setDinersCount] = useState(2)
  const [recipeScene, setRecipeScene] = useState<SceneType>(() => getStoredScene())
  const [showFavorites, setShowFavorites] = useState(false)
  const [favoriteItems, setFavoriteItems] = useState<Recipe[]>([])

  const loadFavoriteItems = useCallback(() => {
    setFavoriteItems(getFavoriteDetails())
  }, [])

  useDidShow(() => {
    loadFavoriteItems()
    try {
      if (Taro.getStorageSync(STORAGE_KEYS.profileOpenFavorites)) {
        Taro.removeStorageSync(STORAGE_KEYS.profileOpenFavorites)
        setShowFavorites(true)
      }
    } catch {
      /* ignore */
    }
  })

  useEffect(() => {
    const count = Taro.getStorageSync(STORAGE_KEYS.defaultDinersCount) || 2
    setDinersCount(count)
    setRecipeScene(getStoredScene())
    if (usesLlmProxy()) {
      void checkApiKey().then((r) => setApiKeyValid(r.valid))
    }
  }, [])

  const SCENE_OPTIONS: { key: SceneType; label: string }[] = [
    { key: 'normal', label: '日常' },
    { key: 'runner', label: '运动后' },
    { key: 'quick', label: '快手' },
    { key: 'muscle', label: '高蛋白' },
  ]

  const applyScene = (k: SceneType) => {
    setRecipeScene(k)
    setStoredScene(k)
    Taro.showToast({ title: '已保存推荐场景', icon: 'success' })
  }

  const handleTestLlmProxy = async () => {
    Taro.showLoading({ title: '检测中…' })
    const result = await checkApiKey()
    Taro.hideLoading()
    setApiKeyValid(result.valid)
    if (result.valid) {
      Taro.showToast({ title: '中转可用', icon: 'success' })
    } else {
      Taro.showModal({ title: '检测失败', content: result.error || '请检查 Vercel 环境与小程序 request 域名', showCancel: false })
    }
  }

  const handleDinersChange = (delta: number) => {
    const next = Math.max(1, Math.min(10, dinersCount + delta))
    setDinersCount(next)
    Taro.setStorageSync(STORAGE_KEYS.defaultDinersCount, next)
  }

  const favCount = getFavoriteCount()
  const cookedLen = getCookedRecipes().length

  const stats: { label: string; value: number; action: 'pantry' | 'favorites' | 'cooked' }[] = [
    { label: '冰箱食材', value: pantryStore.totalCount, action: 'pantry' },
    { label: '收藏菜谱', value: favCount, action: 'favorites' },
    { label: '做过的菜', value: cookedLen, action: 'cooked' },
  ]

  const userStats = useMemo(() => getUserStats(pantryStore.items), [pantryStore.items])
  const allAchievements = useMemo(() => getAllAchievements(userStats), [userStats])

  const onStatClick = (action: 'pantry' | 'favorites' | 'cooked') => {
    if (action === 'pantry') {
      Taro.switchTab({ url: '/pages/pantry/index' })
      return
    }
    if (action === 'favorites') {
      loadFavoriteItems()
      setShowFavorites(true)
      return
    }
    setCookedRecipes(getCookedRecipes())
    setShowHistory(true)
  }

  if (showFavorites) {
    const isEmpty = favoriteItems.length === 0
    return (
      <View style={{ minHeight: '100vh', backgroundColor: D.bg }}>
        <View
          style={{
            padding: '20px',
            backgroundColor: D.bgElevated,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: `0.5px solid ${D.separatorLight}`,
          }}
        >
          <Text style={{ fontSize: '16px', color: D.accent }} onClick={() => setShowFavorites(false)}>
            ← 返回
          </Text>
          <Text style={{ fontSize: '18px', fontWeight: '700', color: D.label }}>我的收藏</Text>
        </View>
        <ScrollView scrollY style={{ flex: 1, padding: '20px' }}>
          {isEmpty ? (
            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '48px' }}>
              <Text style={{ fontSize: '48px', marginBottom: '12px' }}>⭐</Text>
              <Text style={{ fontSize: '16px', fontWeight: '600', color: D.label, marginBottom: '8px' }}>暂无收藏</Text>
              <Text style={{ fontSize: '14px', color: D.labelTertiary, textAlign: 'center', paddingLeft: 28, paddingRight: 28 }}>
                在推荐列表点「♡」即可收藏
              </Text>
              <View style={{ marginTop: 24, width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <View
                  style={{
                    height: 48,
                    borderRadius: 999,
                    backgroundColor: D.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() =>
                    Taro.navigateTo({
                      url: `/pages/result/index?from=random&scene=${getStoredScene()}`,
                    })
                  }
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>去看推荐</Text>
                </View>
              </View>
            </View>
          ) : (
            favoriteItems.map((item, idx) => {
              const r = enrichRecipeMedia(item)
              return (
                <View
                  key={String(r.id ?? idx)}
                  style={{ ...Com.cardRowStyle, marginBottom: 10 }}
                  onClick={() => {
                    Taro.setStorageSync(STORAGE_KEYS.selectedRecipeDetail, r)
                    Taro.navigateTo({ url: '/pages/detail/index' })
                  }}
                >
                  <View style={Com.emojiBoxSmallStyle}>
                    {r.image ? (
                      <Image
                        src={r.image}
                        mode="aspectFill"
                        style={{ width: '100%', height: '100%', display: 'block' }}
                        lazyLoad
                      />
                    ) : (
                      <Text>{r.emoji || '🥘'}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={Com.titleStyle}>{r.title}</Text>
                    <Text style={Com.textMutedStyle} numberOfLines={1}>
                      {r.quote || r.nutritionAnalysis || '点击查看详情'}
                    </Text>
                  </View>
                  <View
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(r)
                      loadFavoriteItems()
                      Taro.showToast({ title: '已取消收藏', icon: 'none' })
                    }}
                    style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}
                  >
                    <Text style={{ fontSize: 18 }}>♥</Text>
                    <Text style={{ fontSize: 10, color: D.labelTertiary, fontWeight: '600' }}>取消</Text>
                  </View>
                </View>
              )
            })
          )}
        </ScrollView>
      </View>
    )
  }

  if (showHistory) {
    return (
      <View style={{ minHeight: '100vh', backgroundColor: D.bg }}>
        <View style={{ padding: '20px', backgroundColor: D.bgElevated, display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `0.5px solid ${D.separatorLight}` }}>
          <Text style={{ fontSize: '16px', color: D.accent }} onClick={() => setShowHistory(false)}>← 返回</Text>
          <Text style={{ fontSize: '18px', fontWeight: '700', color: D.label }}>做过的菜</Text>
        </View>
        <ScrollView scrollY style={{ padding: '20px' }}>
          {cookedRecipes.length === 0 ? (
            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '80px' }}>
              <Text style={{ fontSize: '48px', marginBottom: '12px' }}>👨‍🍳</Text>
              <Text style={{ fontSize: '15px', color: D.labelTertiary }}>还没有做过菜的记录</Text>
            </View>
          ) : (
            cookedRecipes.map((item, idx) => (
              <View
                key={idx}
                style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '14px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px', border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}
                onClick={() => {
                  Taro.setStorageSync(STORAGE_KEYS.selectedRecipeDetail, item)
                  Taro.navigateTo({ url: '/pages/detail/index' })
                }}
              >
                <Text style={{ fontSize: '32px' }}>{item.emoji || '🥘'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: '16px', fontWeight: '600', color: D.label, display: 'block' }}>{item.title}</Text>
                  <Text style={{ fontSize: '12px', color: D.labelTertiary }}>
                    {new Date(item.cookedAt).toLocaleDateString('zh-CN')} 做过
                  </Text>
                </View>
                <Text style={{ color: D.labelTertiary }}>›</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    )
  }

  if (showAbout) {
    return (
      <View style={{ minHeight: '100vh', backgroundColor: D.bg }}>
        <View style={{ padding: '20px', backgroundColor: D.bgElevated, display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `0.5px solid ${D.separatorLight}` }}>
          <Text style={{ fontSize: '16px', color: D.accent }} onClick={() => setShowAbout(false)}>← 返回</Text>
          <Text style={{ fontSize: '18px', fontWeight: '700', color: D.label }}>关于</Text>
        </View>
        <View style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Text style={{ fontSize: '64px', marginBottom: '16px' }}>🍳</Text>
          <Text style={{ fontSize: '22px', fontWeight: '700', color: D.label, marginBottom: '4px' }}>爱心厨房</Text>
          <Text style={{ fontSize: '14px', color: D.labelTertiary, marginBottom: '24px' }}>Love Kitchen v1.0</Text>
          <View style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '20px', width: '100%', border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}>
            <Text style={{ fontSize: '14px', color: D.labelSecondary, lineHeight: '1.8', display: 'block' }}>
              面向家庭的 AI 厨房助手微信小程序。
            </Text>
            <Text style={{ fontSize: '14px', color: D.labelSecondary, lineHeight: '1.8', display: 'block', marginTop: '8px' }}>
              解决「今天吃什么、怎么做」以及食材浪费问题。通过极简管理、智能决策、高效执行，让每一餐都有爱。
            </Text>
            <Text style={{ fontSize: '13px', color: D.labelTertiary, display: 'block', marginTop: '16px' }}>
              爱心厨房 — 让每一餐都有爱。
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
      <View style={{ minHeight: '100vh', backgroundColor: D.bg }}>
      <View style={{ padding: '44px 22px 20px' }}>
        <Text style={{ fontSize: D.titleLarge, fontWeight: D.weightBold, color: D.label, letterSpacing: '-0.04em' }}>我的</Text>
        <Text style={{ fontSize: D.footnote, color: D.labelSecondary, marginTop: 6 }}>爱心厨房</Text>
        <View style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {stats.map((s, i) => (
            <View
              key={i}
              style={{ flex: 1, backgroundColor: D.bgElevated, borderRadius: D.radiusM, padding: '14px 10px', textAlign: 'center', border: `0.5px solid ${D.separatorLight}` }}
              onClick={() => onStatClick(s.action)}
            >
              <Text style={{ fontSize: D.headline, fontWeight: D.weightBold, color: D.label, display: 'block' }}>{s.value}</Text>
              <Text style={{ fontSize: 11, color: D.labelSecondary, marginTop: 4 }}>{s.label}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 11, color: D.labelTertiary, marginTop: 10, textAlign: 'center', lineHeight: 1.4 }}>
          点击数据：冰箱 · 收藏列表 · 做过的菜
        </Text>

        {/* 成就徽章 */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: D.footnote, fontWeight: D.weightSemibold, color: D.labelSecondary, marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>成就</Text>
          <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allAchievements.map((a) => (
              <View
                key={a.id}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: D.radiusS,
                  backgroundColor: a.unlocked ? D.accentMuted : D.bg,
                  border: `0.5px solid ${a.unlocked ? D.accentLine : D.separatorLight}`,
                  opacity: a.unlocked ? 1 : 0.55,
                }}
              >
                <Text style={{ fontSize: 18 }}>{a.emoji}</Text>
                <View>
                  <Text style={{ fontSize: D.footnote, fontWeight: D.weightSemibold, color: a.unlocked ? D.label : D.labelTertiary }}>{a.title}</Text>
                  <Text style={{ fontSize: D.caption, color: D.labelTertiary }}>{a.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Menu */}
      <View style={{ padding: '0 22px 32px' }}>
        <View style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusM, padding: 16, marginBottom: 12, border: `0.5px solid ${D.separatorLight}` }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: D.labelSecondary, marginBottom: 12 }}>默认 AI 场景</Text>
          <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SCENE_OPTIONS.map(({ key, label }) => (
              <View
                key={key}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  backgroundColor: recipeScene === key ? D.label : D.bg,
                  border: recipeScene === key ? 'none' : `0.5px solid ${D.separator}`,
                }}
                onClick={() => applyScene(key)}
              >
                <Text style={{ fontSize: D.body, fontWeight: D.weightSemibold, color: recipeScene === key ? D.bgElevated : D.labelSecondary }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View
          style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}
        >
          <Text style={{ fontSize: '24px' }}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: '600', color: D.label, display: 'block' }}>
              智能推荐服务
            </Text>
            <Text style={{ fontSize: '13px', color: apiKeyValid === false ? D.red : apiKeyValid === true ? D.green : D.labelTertiary }}>
              {apiKeyValid === false
                ? '中转不可用，请检查部署与合法域名'
                : apiKeyValid === true
                  ? '已启用：密钥在服务器，客户端不携带 Key'
                  : '正在检测…'}
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '16px', marginBottom: '12px', marginTop: '-4px', border: `0.5px solid ${D.separatorLight}` }}>
          <Button
            style={{ height: '40px', backgroundColor: D.accent, color: '#fff', borderRadius: '20px', fontSize: '14px', border: 'none' }}
            onClick={handleTestLlmProxy}
          >检测中转连通性</Button>
        </View>

        {/* Diners Count */}
        <View style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}>
          <Text style={{ fontSize: '24px' }}>👥</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: '600', color: D.label, display: 'block' }}>默认就餐人数</Text>
            <Text style={{ fontSize: '13px', color: D.labelTertiary }}>推荐菜谱份量参考</Text>
          </View>
          <View style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <View
              style={{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: D.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `0.5px solid ${D.separatorLight}` }}
              onClick={() => handleDinersChange(-1)}
            ><Text style={{ fontSize: '18px', color: D.blue }}>-</Text></View>
            <Text style={{ fontSize: '18px', fontWeight: '700', color: D.accent, minWidth: '24px', textAlign: 'center' }}>{dinersCount}</Text>
            <View
              style={{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: D.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => handleDinersChange(1)}
            ><Text style={{ fontSize: '18px', color: '#fff' }}>+</Text></View>
          </View>
        </View>

        {/* About */}
        <View
          style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}
          onClick={() => setShowAbout(true)}
        >
          <Text style={{ fontSize: '24px' }}>ℹ️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: '600', color: D.label, display: 'block' }}>关于</Text>
            <Text style={{ fontSize: '13px', color: D.labelTertiary }}>爱心厨房 v1.0</Text>
          </View>
          <Text style={{ fontSize: '16px', color: D.labelTertiary }}>›</Text>
        </View>

        {/* Reset Mock Data */}
        <View
          style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}
          onClick={() => {
            Taro.showModal({
              title: '重置冰箱',
              content: '将冰箱食材恢复为示例数据，确认？',
              success: (res) => {
                if (res.confirm) {
                  pantryStore.resetToMock()
                  Taro.showToast({ title: '已重置', icon: 'success' })
                }
              }
            })
          }}
        >
          <Text style={{ fontSize: '24px' }}>🔄</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: '600', color: D.label, display: 'block' }}>重置冰箱数据</Text>
            <Text style={{ fontSize: '13px', color: D.labelTertiary }}>恢复示例食材数据</Text>
          </View>
          <Text style={{ fontSize: '16px', color: D.labelTertiary }}>›</Text>
        </View>
      </View>
    </View>
  )
}

export default observer(Profile)
