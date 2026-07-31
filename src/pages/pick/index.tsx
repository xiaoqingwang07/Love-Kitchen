import { View, Text, ScrollView, Input, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { usePantryStore } from '../../store/context'
import { addSearchHistory } from '../../store/storageUtils'
import { getDaysLeft } from '../../types/pantry'
import { getStoredScene } from '../../api/recipe'
import { consumePickAutoSelectIngredients } from '../../utils/navigationPayload'
import { D } from '../../theme/designTokens'
import { slotHint } from '../../utils/slotLabel'

/**
 * 食材分类。
 * 原先只有「蔬菜 / 肉类」两类，且归类有误——鸡蛋在肉类里、豆腐在蔬菜里、
 * 鱼虾也塞在肉类。现拆为六类，并补齐家常做饭绕不开的菌菇、主食、调味。
 */
const CATEGORIES = [
  {
    title: '蔬菜',
    emoji: '🥬',
    items: ['土豆', '西红柿', '黄瓜', '茄子', '青椒', '洋葱', '胡萝卜', '白萝卜', '菠菜', '青菜', '生菜', '油麦菜', '油菜', '娃娃菜', '包菜', '西兰花', '花菜', '芹菜', '韭菜', '豆芽', '豆角', '丝瓜', '苦瓜', '南瓜', '西葫芦', '莴笋', '藕', '山药', '芋头', '红薯', '玉米', '荷兰豆']
  },
  {
    title: '菌菇',
    emoji: '🍄',
    items: ['香菇', '金针菇', '杏鲍菇', '平菇', '木耳', '银耳', '茶树菇', '口蘑', '海鲜菇', '滑子菇']
  },
  {
    title: '肉类',
    emoji: '🥩',
    items: ['猪肉', '五花肉', '排骨', '里脊肉', '肉末', '牛肉', '牛腩', '牛腱', '牛排', '肥牛', '牛肉丸', '羊肉', '鸡肉', '鸡翅', '鸡腿', '鸡胸肉', '鸡爪', '鸭肉', '火腿肠', '午餐肉', '培根', '香肠']
  },
  {
    title: '水产',
    emoji: '🦐',
    items: ['鱼', '鲈鱼', '带鱼', '巴沙鱼', '三文鱼', '鲫鱼', '黄花鱼', '虾', '虾仁', '虾滑', '花甲', '蛤蜊', '鱿鱼', '扇贝', '螃蟹', '海带', '紫菜']
  },
  {
    title: '蛋奶豆',
    emoji: '🥚',
    items: ['鸡蛋', '鸭蛋', '咸鸭蛋', '皮蛋', '鹌鹑蛋', '牛奶', '酸奶', '奶酪', '黄油', '豆腐', '嫩豆腐', '冻豆腐', '豆干', '豆皮', '腐竹', '千张', '豆浆']
  },
  {
    // 只留能「决定这顿吃什么」的主食：面条能想到打卤面，饺子皮能想到包饺子。
    // 大米/面粉/油盐酱醋这类基础调料不进选择列表——没人靠选生抽来决定晚饭吃啥。
    title: '主食',
    emoji: '🍚',
    items: ['面条', '挂面', '意面', '米粉', '河粉', '粉丝', '饺子皮', '馄饨皮', '年糕', '馒头', '包子', '吐司', '米饭']
  }
]

function Pick() {
  const pantryStore = usePantryStore()
  const [selected, setSelected] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [ingredientFilter, setIngredientFilter] = useState('')

  const expiringNames = useMemo(() => {
    return pantryStore.expiringItems.map(i => i.name)
  }, [pantryStore.expiringItems])

  const applyAutoSelect = () => {
    const names = consumePickAutoSelectIngredients()
    if (names.length > 0) {
      setSelected(prev => Array.from(new Set([...prev, ...names])))
    }
  }

  const filterHasMatch = useMemo(() => {
    const raw = ingredientFilter.trim()
    if (!raw) return true
    const q = raw.toLowerCase()
    return CATEGORIES.some((cat) =>
      cat.items.some((name) => name.toLowerCase().includes(q) || name.includes(raw))
    )
  }, [ingredientFilter])

  useDidShow(() => {
    applyAutoSelect()
  })

  const handleSelectAllExpiring = () => {
    const names = pantryStore.expiringItems.map((i) => i.name)
    if (names.length === 0) {
      Taro.showToast({ title: '暂无临期食材', icon: 'none' })
      return
    }
    setSelected((prev) => Array.from(new Set([...prev, ...names])))
    Taro.showToast({ title: `已加入 ${names.length} 项临期`, icon: 'success' })
  }

  const toggleSelect = (name: string) => {
    setSelected(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const handleInputConfirm = () => {
    const v = inputValue.trim()
    if (v) {
      toggleSelect(v)
      setInputValue('')
    }
  }

  const handleMatch = () => {
    if (selected.length === 0) {
      Taro.showToast({ title: '先选些食材吧~', icon: 'none' })
      return
    }
    addSearchHistory(selected.join('、'))
    const scene = getStoredScene()
    // 将临期食材名称也传给 result 页，用于临期加权排序
    const expiringParam = expiringNames.length > 0
      ? `&expiring=${encodeURIComponent(expiringNames.join(','))}`
      : ''
    Taro.navigateTo({
      url: `/pages/result/index?from=meal&ingredients=${encodeURIComponent(selected.join(','))}&scene=${scene}${expiringParam}`,
    })
  }

  const handleClear = () => setSelected([])

  const handleImportPantry = () => {
    const names = pantryStore.items.map((i) => i.name)
    if (names.length === 0) {
      Taro.showModal({
        title: '冰箱暂无食材',
        content: '请到「冰箱」Tab 点格子添加，或使用底部「小票入库」。也可在本页直接勾选食材。',
        confirmText: '去冰箱',
        cancelText: '知道了',
        success: (res) => {
          if (res.confirm) Taro.switchTab({ url: '/pages/pantry/index' })
        },
      })
      return
    }
    setSelected((prev) => Array.from(new Set([...prev, ...names])))
    Taro.showToast({ title: `已合并冰箱 ${names.length} 项`, icon: 'success' })
  }

  const pantryEmpty = pantryStore.totalCount === 0

  return (
    <View style={{ minHeight: '100vh', backgroundColor: D.bg, paddingBottom: '120px' }}>
      {/* 原有大标题「今晚」+ 副标题「勾选食材，生成一顿饭方案」已移除：
          页面名在原生导航栏，下方「选择食材」卡片本身已说明用途。 */}
      {pantryEmpty ? (
        <View
          style={{
            margin: '0 22px 14px',
            padding: '14px 16px',
            backgroundColor: D.accentWarmMuted,
            borderRadius: D.radiusM,
            border: `0.5px solid ${D.accentLine}`,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: D.label, marginBottom: 6 }}>冰箱还是空的</Text>
          <Text className="lk-block" style={{ fontSize: 12, color: D.labelSecondary, lineHeight: 1.5, marginBottom: 12 }}>
            先去「冰箱」录入食材，临期会在这里高亮；或在本页直接勾选/输入食材也能匹配。首页搜索不依赖冰箱。
          </Text>
          <View style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
            <View
              style={{
                flex: 1,
                height: 42,
                borderRadius: D.radiusS,
                backgroundColor: D.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => Taro.switchTab({ url: '/pages/pantry/index' })}
            >
              <Text style={{ fontSize: D.body, fontWeight: D.weightSemibold, color: D.onAccent }}>去录入食材</Text>
            </View>
            <View
              style={{
                flex: 1,
                height: 42,
                borderRadius: D.radiusS,
                backgroundColor: D.bgElevated,
                border: `0.5px solid ${D.separator}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: D.label }}>回首页搜索</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* 临期 + 手动添加：同一选择面板 */}
      <View style={{ margin: '12px 22px 16px', padding: '18px 18px', backgroundColor: D.bgElevated, borderRadius: D.radiusM, border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: D.label, letterSpacing: '-0.02em' }}>选择食材</Text>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {selected.length > 0 ? (
              <Text style={{ fontSize: D.footnote, color: D.red, fontWeight: '500' }} onClick={handleClear}>清空</Text>
            ) : null}
            <Text style={{ fontSize: 11, color: D.labelTertiary }} onClick={handleImportPantry}>导入冰箱</Text>
          </View>
        </View>
        <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginBottom: 10 }}>已选 {selected.length} 种</Text>

        {expiringNames.length > 0 && (
          <>
            <View
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: D.caption, fontWeight: D.weightSemibold, color: D.accentWarm, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>
                临期 · 优先消耗
              </Text>
              <Text
                className="tap-scale"
                style={{ fontSize: D.caption, color: D.accentDeep, fontWeight: D.weightSemibold }}
                onClick={handleSelectAllExpiring}
              >
                全部加入
              </Text>
            </View>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 16 }}>
              {pantryStore.expiringItems.map(item => {
                const days = getDaysLeft(item)
                const isSelected = selected.includes(item.name)
                return (
                  <View
                    key={item.id}
                    style={{
                      padding: '6px 12px', borderRadius: D.radiusS, fontSize: '13px',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      ...(isSelected
                        ? { backgroundColor: D.accent, border: `0.5px solid ${D.accent}` }
                        : { backgroundColor: D.accentWarmMuted, border: `0.5px solid ${D.accentLine}` }
                      )
                    }}
                    onClick={() => toggleSelect(item.name)}
                  >
                    <Text style={{ color: isSelected ? D.onAccent : D.label, fontSize: D.footnote, fontWeight: D.weightMedium }}>
                      {item.name}
                    </Text>
                    <Text style={{ color: isSelected ? 'rgba(58,52,46,0.62)' : D.accentWarm, fontSize: D.caption, marginLeft: 5 }}>
                      {slotHint(item)} · {days <= 0 ? '今天' : `${days}天`}
                    </Text>
                    {isSelected ? <Text style={{ color: D.onAccent, fontSize: D.footnote }}> ✓</Text> : null}
                  </View>
                )
              })}
            </View>
            <View style={{ height: 0.5, backgroundColor: D.separator, marginBottom: 16 }} />
          </>
        )}

        <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginBottom: 8 }}>手动输入</Text>
        <View style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Input
            style={{ flex: 1, height: '44px', backgroundColor: D.bg, borderRadius: D.radiusS, padding: '0 16px', fontSize: '15px', border: `0.5px solid ${D.separatorLight}` }}
            placeholder='输入食材名称，回车或点添加'
            value={inputValue}
            onInput={(e) => setInputValue(e.detail.value)}
            onConfirm={handleInputConfirm}
          />
          <View
            style={{ width: '44px', height: '44px', backgroundColor: D.accent, borderRadius: D.radiusS, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={handleInputConfirm}
          >
            <Text style={{ color: D.onAccent, fontSize: '20px', fontWeight: '300' }}>+</Text>
          </View>
        </View>
      </View>

      <View style={{ padding: '0 22px 8px' }}>
        <Text className="lk-block" style={{ fontSize: D.caption, color: D.labelTertiary, marginBottom: 8 }}>筛选食材（输入即过滤列表）</Text>
        <Input
          style={{
            height: 44,
            backgroundColor: D.bgElevated,
            borderRadius: D.radiusS,
            padding: '0 16px',
            fontSize: 15,
            border: `0.5px solid ${D.separatorLight}`,
          }}
          placeholder="例如：茄、鸡胸、菇…"
          value={ingredientFilter}
          onInput={(e) => setIngredientFilter(e.detail.value)}
        />
      </View>

      {!filterHasMatch ? (
        <View style={{ padding: '12px 22px' }}>
          <Text className="lk-block" style={{ fontSize: 13, color: D.labelTertiary, textAlign: 'center' }}>
            没有匹配的食材，试试别的关键字或清空筛选
          </Text>
        </View>
      ) : null}

      {/* Category Grid */}
      <ScrollView scrollY style={{ padding: '0 22px' }}>
        {CATEGORIES.map((cat) => {
          const q = ingredientFilter.trim().toLowerCase()
          const items = q
            ? cat.items.filter((name) => name.toLowerCase().includes(q) || name.includes(ingredientFilter.trim()))
            : cat.items
          if (items.length === 0) return null
          return (
          <View key={cat.title}>
            <View style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', marginTop: '16px' }}>
              <Text>{cat.emoji}</Text>
              <Text style={{ fontSize: '16px', fontWeight: '600', color: D.label }}>{cat.title}</Text>
            </View>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {items.map(item => {
                const isSelected = selected.includes(item)
                const isExpiring = expiringNames.includes(item)
                const pin = pantryStore.items.find((i) => i.name === item)
                return (
                  <View
                    key={item}
                    style={{
                      padding: '8px 14px', borderRadius: D.radiusS, fontSize: D.footnote,
                      ...(isSelected
                        ? { backgroundColor: D.accent, border: `0.5px solid ${D.accent}`, color: D.onAccent }
                        : isExpiring
                          ? { backgroundColor: D.accentWarmMuted, border: `0.5px solid ${D.accentLine}`, color: D.label }
                          : { backgroundColor: D.bgElevated, border: `0.5px solid ${D.separator}`, color: D.label }
                      )
                    }}
                    onClick={() => toggleSelect(item)}
                  >
                    <Text style={{ fontSize: D.footnote, fontWeight: D.weightMedium, color: isSelected ? D.onAccent : D.label }}>{item}</Text>
                    {/* 位置提示与食材名同行，靠 marginLeft 拉开，否则会连成「生菜藏2层」 */}
                    {pin ? (
                      <Text style={{ fontSize: D.caption2, color: isSelected ? 'rgba(58,52,46,0.62)' : D.labelTertiary, marginLeft: 5 }}>{slotHint(pin)}</Text>
                    ) : null}
                    {isSelected ? <Text style={{ color: D.onAccent }}> ✓</Text> : null}
                  </View>
                )
              })}
            </View>
          </View>
          )
        })}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={{
        position: 'fixed', bottom: 0, left: 0, width: '100%', backgroundColor: D.bgGlassHeavy,
        backdropFilter: 'blur(20px)', padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        boxShadow: '0 -4px 24px rgba(18,17,15,0.06)', display: 'flex', gap: '12px', boxSizing: 'border-box',
        borderTop: `0.5px solid ${D.separatorLight}`,
      }}>
        {selected.length > 0 && (
          <View style={{
            display: 'flex', alignItems: 'center', backgroundColor: D.accentMuted,
            borderRadius: 999, padding: '0 14px', border: `0.5px solid ${D.accentLine}`,
            maxWidth: '48%', overflow: 'hidden'
          }}>
            <Text style={{ fontSize: 13, color: D.accentDeep, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selected.join('、')}
            </Text>
          </View>
        )}
        {/* 用 View 而非 Button：Taro 的 Button 在 selected 由空变非空时
            不会从 DOM 移除 disabled 属性，导致选完食材点按钮毫无反应。
            空选的提示由 handleMatch 内部负责。 */}
        <View
          className="tap-scale"
          style={{
            flex: 1,
            height: 48,
            backgroundColor: selected.length > 0 ? D.accent : D.separatorLight,
            borderRadius: D.radiusS,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={handleMatch}
        >
          <Text
            style={{
              color: selected.length > 0 ? D.onAccent : D.labelTertiary,
              fontSize: D.body,
              fontWeight: D.weightSemibold,
            }}
          >
            {selected.length > 0 ? `生成搭配方案 · ${selected.length} 种` : '请选择食材'}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default observer(Pick)
