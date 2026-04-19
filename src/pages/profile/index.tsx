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
import type { SceneType } from '../../types/recipe'
import type { Recipe } from '../../types/recipe'
import { getUserStats, getAllAchievements } from '../../utils/achievements'

/** 仅在开发/体验版环境显示工程调试入口 */
function isDevEnv(): boolean {
  try {
    const info = Taro.getAccountInfoSync?.()
    const env = info?.miniProgram?.envVersion
    return env === 'develop' || env === 'trial'
  } catch {
    return false
  }
}

const SCENE_OPTIONS: { key: SceneType; label: string }[] = [
  { key: 'normal', label: '日常' },
  { key: 'runner', label: '运动后' },
  { key: 'quick', label: '快手' },
  { key: 'muscle', label: '高蛋白' },
]

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
  const [aboutTaps, setAboutTaps] = useState(0)
  const [devUnlocked, setDevUnlocked] = useState(isDevEnv())

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

  const applyScene = (k: SceneType) => {
    setRecipeScene(k)
    setStoredScene(k)
    Taro.showToast({ title: '已保存', icon: 'success' })
  }

  const handleTestLlmProxy = async () => {
    Taro.showLoading({ title: '检测中…' })
    const result = await checkApiKey()
    Taro.hideLoading()
    setApiKeyValid(result.valid)
    if (result.valid) {
      Taro.showToast({ title: '中转可用', icon: 'success' })
    } else {
      Taro.showModal({
        title: '检测失败',
        content: result.error || '请检查 Vercel 部署与 request 合法域名',
        showCancel: false,
      })
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
    { label: '收藏', value: favCount, action: 'favorites' },
    { label: '做过', value: cookedLen, action: 'cooked' },
  ]

  const userStats = useMemo(() => getUserStats(pantryStore.items), [pantryStore.items])
  const allAchievements = useMemo(() => getAllAchievements(userStats), [userStats])
  const unlockedCount = allAchievements.filter((a) => a.unlocked).length

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

  const handleResetMock = () => {
    Taro.showModal({
      title: '重置冰箱数据',
      content: '这会把冰箱清空并填入 18 条示例食材，当前库存全部丢失。继续？',
      confirmText: '重置',
      confirmColor: '#D05A38',
      success: (res) => {
        if (res.confirm) {
          Taro.showModal({
            title: '再次确认',
            content: '此操作不可撤销',
            confirmText: '确认重置',
            confirmColor: '#D05A38',
            success: (r2) => {
              if (r2.confirm) {
                pantryStore.resetToMock()
                Taro.showToast({ title: '已重置', icon: 'success' })
              }
            },
          })
        }
      },
    })
  }

  // ---------- 收藏列表 ----------
  if (showFavorites) {
    const isEmpty = favoriteItems.length === 0
    return (
      <View style={{ minHeight: '100vh', backgroundColor: D.bg }}>
        <View
          style={{
            padding: '20px 22px',
            backgroundColor: D.bgElevated,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: `0.5px solid ${D.separatorLight}`,
          }}
        >
          <Text
            style={{ fontSize: D.body, color: D.accent }}
            onClick={() => setShowFavorites(false)}
          >
            ← 返回
          </Text>
          <Text
            style={{
              fontSize: D.headline,
              fontWeight: D.weightBold,
              color: D.label,
              letterSpacing: '-0.02em',
            }}
          >
            收藏
          </Text>
        </View>
        <ScrollView scrollY style={{ padding: '16px 22px 40px' }}>
          {isEmpty ? (
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: 64,
              }}
            >
              <Text style={{ fontSize: 52, marginBottom: 16 }}>♡</Text>
              <Text
                style={{
                  fontSize: D.body,
                  fontWeight: D.weightSemibold,
                  color: D.label,
                  marginBottom: 6,
                }}
              >
                还没有收藏
              </Text>
              <Text
                style={{
                  fontSize: D.footnote,
                  color: D.labelTertiary,
                  textAlign: 'center',
                  padding: '0 40px',
                  lineHeight: 1.5,
                }}
              >
                在推荐列表点 ♡ 就能收藏到这里
              </Text>
            </View>
          ) : (
            favoriteItems.map((item, idx) => {
              const r = enrichRecipeMedia(item)
              return (
                <View
                  key={String(r.id ?? idx)}
                  className="tap-scale"
                  style={{
                    backgroundColor: D.bgElevated,
                    borderRadius: D.radiusM,
                    padding: 14,
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    border: `0.5px solid ${D.separatorLight}`,
                    boxShadow: D.shadowCard,
                  }}
                  onClick={() => {
                    Taro.setStorageSync(STORAGE_KEYS.selectedRecipeDetail, r)
                    Taro.navigateTo({ url: '/pages/detail/index' })
                  }}
                >
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      backgroundColor: D.bg,
                      borderRadius: D.radiusS,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {r.image ? (
                      <Image
                        src={r.image}
                        mode="aspectFill"
                        style={{ width: '100%', height: '100%' }}
                        lazyLoad
                      />
                    ) : (
                      <Text style={{ fontSize: 28 }}>{r.emoji || '🥘'}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        fontSize: D.subheadline,
                        fontWeight: D.weightSemibold,
                        color: D.label,
                      }}
                    >
                      {r.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: D.caption,
                        color: D.labelTertiary,
                        marginTop: 4,
                      }}
                      numberOfLines={1}
                    >
                      {r.quote || r.nutritionAnalysis || '点开查看做法'}
                    </Text>
                  </View>
                  <Text
                    style={{ fontSize: 22, color: D.accentWarm, padding: '0 6px' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(r)
                      loadFavoriteItems()
                      Taro.showToast({ title: '已取消', icon: 'none' })
                    }}
                  >
                    ♥
                  </Text>
                </View>
              )
            })
          )}
        </ScrollView>
      </View>
    )
  }

  // ---------- 做过的菜 ----------
  if (showHistory) {
    return (
      <View style={{ minHeight: '100vh', backgroundColor: D.bg }}>
        <View
          style={{
            padding: '20px 22px',
            backgroundColor: D.bgElevated,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: `0.5px solid ${D.separatorLight}`,
          }}
        >
          <Text
            style={{ fontSize: D.body, color: D.accent }}
            onClick={() => setShowHistory(false)}
          >
            ← 返回
          </Text>
          <Text
            style={{
              fontSize: D.headline,
              fontWeight: D.weightBold,
              color: D.label,
              letterSpacing: '-0.02em',
            }}
          >
            做过的菜
          </Text>
        </View>
        <ScrollView scrollY style={{ padding: '16px 22px 40px' }}>
          {cookedRecipes.length === 0 ? (
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: 80,
              }}
            >
              <Text style={{ fontSize: 52, marginBottom: 16 }}>👨‍🍳</Text>
              <Text style={{ fontSize: D.footnote, color: D.labelTertiary }}>
                还没有做菜记录，做一道试试
              </Text>
            </View>
          ) : (
            cookedRecipes.map((item, idx) => (
              <View
                key={idx}
                className="tap-scale"
                style={{
                  backgroundColor: D.bgElevated,
                  borderRadius: D.radiusM,
                  padding: '14px 16px',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  border: `0.5px solid ${D.separatorLight}`,
                }}
                onClick={() => {
                  Taro.setStorageSync(STORAGE_KEYS.selectedRecipeDetail, item)
                  Taro.navigateTo({ url: '/pages/detail/index' })
                }}
              >
                <Text style={{ fontSize: 30 }}>{item.emoji || '🥘'}</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: D.subheadline,
                      fontWeight: D.weightSemibold,
                      color: D.label,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 2 }}>
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

  // ---------- 关于 ----------
  if (showAbout) {
    return (
      <View style={{ minHeight: '100vh', backgroundColor: D.bg }}>
        <View
          style={{
            padding: '20px 22px',
            backgroundColor: D.bgElevated,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: `0.5px solid ${D.separatorLight}`,
          }}
        >
          <Text
            style={{ fontSize: D.body, color: D.accent }}
            onClick={() => {
              setShowAbout(false)
              setAboutTaps(0)
            }}
          >
            ← 返回
          </Text>
          <Text
            style={{
              fontSize: D.headline,
              fontWeight: D.weightBold,
              color: D.label,
              letterSpacing: '-0.02em',
            }}
          >
            关于
          </Text>
        </View>
        <View
          style={{
            padding: '48px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Text
            style={{ fontSize: 72, marginBottom: 20 }}
            onClick={() => {
              const next = aboutTaps + 1
              setAboutTaps(next)
              if (next >= 7) {
                setDevUnlocked(true)
                Taro.showToast({ title: '已解锁开发者选项', icon: 'none' })
              }
            }}
          >
            🍳
          </Text>
          <Text
            style={{
              fontSize: D.title,
              fontWeight: D.weightBold,
              color: D.label,
              marginBottom: 6,
              letterSpacing: '-0.02em',
            }}
          >
            爱心厨房
          </Text>
          <Text style={{ fontSize: D.footnote, color: D.labelTertiary, marginBottom: 28 }}>
            Love Kitchen · v1.1
          </Text>
          <View
            style={{
              backgroundColor: D.bgElevated,
              borderRadius: D.radiusL,
              padding: 20,
              width: '100%',
              border: `0.5px solid ${D.separatorLight}`,
              boxShadow: D.shadowCard,
            }}
          >
            <Text
              style={{
                fontSize: D.subheadline,
                color: D.labelSecondary,
                lineHeight: 1.7,
              }}
            >
              面向家庭的 AI 厨房助手。把食材管理、今天吃什么、一步一步做到完成，串成一条顺滑的路径。
            </Text>
            <Text
              style={{
                fontSize: D.footnote,
                color: D.labelTertiary,
                marginTop: 14,
                lineHeight: 1.6,
              }}
            >
              让每一餐都有爱。
            </Text>
          </View>
        </View>
      </View>
    )
  }

  // ---------- 主页 ----------
  return (
    <View style={{ minHeight: '100vh', backgroundColor: D.bg, paddingBottom: 40 }}>
      <View style={{ padding: '44px 22px 20px' }}>
        <Text
          style={{
            fontSize: D.titleLarge,
            fontWeight: D.weightBold,
            color: D.label,
            letterSpacing: '-0.04em',
          }}
        >
          我的
        </Text>
        <Text
          style={{
            fontSize: D.footnote,
            color: D.labelSecondary,
            marginTop: 8,
          }}
        >
          爱心厨房 · 你的家庭饭桌助理
        </Text>

        {/* 数据三联卡 */}
        <View style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {stats.map((s, i) => (
            <View
              key={i}
              className="tap-scale"
              style={{
                flex: 1,
                backgroundColor: D.bgElevated,
                borderRadius: D.radiusM,
                padding: '14px 12px',
                border: `0.5px solid ${D.separatorLight}`,
                boxShadow: D.shadowCard,
              }}
              onClick={() => onStatClick(s.action)}
            >
              <Text
                style={{
                  fontSize: D.title,
                  fontWeight: D.weightBold,
                  color: D.label,
                  letterSpacing: '-0.02em',
                }}
              >
                {s.value}
              </Text>
              <Text
                style={{
                  fontSize: D.caption,
                  color: D.labelSecondary,
                  marginTop: 4,
                }}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* 成就 */}
        <View style={{ marginTop: 28 }}>
          <View
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: D.caption,
                fontWeight: D.weightSemibold,
                color: D.labelSecondary,
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
              }}
            >
              成就
            </Text>
            <Text style={{ fontSize: D.caption, color: D.labelTertiary }}>
              {unlockedCount}/{allAchievements.length}
            </Text>
          </View>
          <View
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            {allAchievements.map((a) => (
              <View
                key={a.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: D.radiusM,
                  backgroundColor: a.unlocked ? D.accentMuted : D.bgElevated,
                  border: `0.5px solid ${
                    a.unlocked ? D.accentLine : D.separatorLight
                  }`,
                  opacity: a.unlocked ? 1 : 0.55,
                }}
              >
                <Text style={{ fontSize: 22 }}>{a.emoji}</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: D.footnote,
                      fontWeight: D.weightSemibold,
                      color: a.unlocked ? D.label : D.labelSecondary,
                    }}
                  >
                    {a.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: D.labelTertiary,
                      marginTop: 2,
                      lineHeight: 1.3,
                    }}
                    numberOfLines={1}
                  >
                    {a.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 偏好设置 */}
      <View style={{ padding: '0 22px 32px' }}>
        <Text
          style={{
            fontSize: D.caption,
            fontWeight: D.weightSemibold,
            color: D.labelSecondary,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            marginBottom: 10,
          }}
        >
          偏好
        </Text>

        {/* 场景 */}
        <View
          style={{
            backgroundColor: D.bgElevated,
            borderRadius: D.radiusM,
            padding: 16,
            marginBottom: 10,
            border: `0.5px solid ${D.separatorLight}`,
          }}
        >
          <Text
            style={{
              fontSize: D.subheadline,
              fontWeight: D.weightSemibold,
              color: D.label,
            }}
          >
            推荐场景
          </Text>
          <Text
            style={{
              fontSize: D.caption,
              color: D.labelTertiary,
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            AI 出菜时会按这个场景调整语气、步骤和营养侧重
          </Text>
          <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {SCENE_OPTIONS.map(({ key, label }) => (
              <View
                key={key}
                className="tap-scale"
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  backgroundColor: recipeScene === key ? D.label : D.bg,
                  border:
                    recipeScene === key ? 'none' : `0.5px solid ${D.separator}`,
                }}
                onClick={() => applyScene(key)}
              >
                <Text
                  style={{
                    fontSize: D.footnote,
                    fontWeight: D.weightSemibold,
                    color: recipeScene === key ? D.bgElevated : D.labelSecondary,
                  }}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 就餐人数 */}
        <View
          style={{
            backgroundColor: D.bgElevated,
            borderRadius: D.radiusM,
            padding: 16,
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: `0.5px solid ${D.separatorLight}`,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                fontSize: D.subheadline,
                fontWeight: D.weightSemibold,
                color: D.label,
              }}
            >
              默认就餐人数
            </Text>
            <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 4 }}>
              份量推荐时的参考值
            </Text>
          </View>
          <View style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <View
              className="tap-scale"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: D.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `0.5px solid ${D.separator}`,
              }}
              onClick={() => handleDinersChange(-1)}
            >
              <Text style={{ fontSize: 18, color: D.label }}>−</Text>
            </View>
            <Text
              style={{
                fontSize: D.headline,
                fontWeight: D.weightBold,
                color: D.label,
                minWidth: 24,
                textAlign: 'center',
              }}
            >
              {dinersCount}
            </Text>
            <View
              className="tap-scale"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: D.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => handleDinersChange(1)}
            >
              <Text style={{ fontSize: 18, color: '#fff' }}>+</Text>
            </View>
          </View>
        </View>

        {/* 联网状态 */}
        {usesLlmProxy() ? (
          <View
            style={{
              backgroundColor: D.bgElevated,
              borderRadius: D.radiusM,
              padding: 16,
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: `0.5px solid ${D.separatorLight}`,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor:
                  apiKeyValid === false
                    ? D.red
                    : apiKeyValid === true
                    ? D.green
                    : D.labelTertiary,
              }}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontSize: D.subheadline,
                  fontWeight: D.weightSemibold,
                  color: D.label,
                }}
              >
                智能推荐
              </Text>
              <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 2 }}>
                {apiKeyValid === false
                  ? '暂不可用，稍后 AI 会自动回退到本地库'
                  : apiKeyValid === true
                  ? '已启用，密钥保存在服务端'
                  : '正在检测…'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* 关于 */}
        <View
          className="tap-scale"
          style={{
            backgroundColor: D.bgElevated,
            borderRadius: D.radiusM,
            padding: 16,
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: `0.5px solid ${D.separatorLight}`,
          }}
          onClick={() => setShowAbout(true)}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: D.subheadline,
                fontWeight: D.weightSemibold,
                color: D.label,
              }}
            >
              关于
            </Text>
            <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 2 }}>
              爱心厨房 v1.1
            </Text>
          </View>
          <Text style={{ color: D.labelTertiary }}>›</Text>
        </View>

        {/* 开发者调试（仅开发/体验版 or 关于页 7 连击解锁） */}
        {devUnlocked ? (
          <View
            style={{
              marginTop: 24,
              padding: '14px 16px',
              borderRadius: D.radiusM,
              border: `0.5px dashed ${D.separator}`,
            }}
          >
            <Text
              style={{
                fontSize: D.caption,
                color: D.labelTertiary,
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
                marginBottom: 10,
              }}
            >
              开发者选项
            </Text>
            <Button
              style={{
                height: 40,
                backgroundColor: D.bg,
                color: D.label,
                borderRadius: 999,
                fontSize: D.footnote,
                border: `0.5px solid ${D.separator}`,
                marginBottom: 10,
              }}
              onClick={handleTestLlmProxy}
            >
              检测 LLM 中转
            </Button>
            <Button
              style={{
                height: 40,
                backgroundColor: D.errorBg,
                color: D.errorFg,
                borderRadius: 999,
                fontSize: D.footnote,
                border: 'none',
              }}
              onClick={handleResetMock}
            >
              重置冰箱数据
            </Button>
          </View>
        ) : null}
      </View>
    </View>
  )
}

export default observer(Profile)
