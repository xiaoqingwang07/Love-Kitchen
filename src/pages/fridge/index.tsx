import { View, Text, ScrollView, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useMemo } from 'react'

// Categories from the reference image
const CATEGORIES = [
    {
        title: '蔬菜 / Veggie',
        items: [
            '芋头', '木耳', '豆芽', '金针菇', '藕', '青菜', '白萝卜',
            '西葫芦', '生菜', '香菇', '娃娃菜', '丝瓜', '红薯', '豆角',
            '粉丝', '莴笋', '包菜', '芹菜', '杏鲍菇', '山药', '油麦菜',
            '油菜', '韭菜', '苦瓜', '平菇'
        ]
    },
    {
        title: '肉类 / Meat',
        items: [
            '猪肉', '排骨', '五花肉', '牛肉', '鸡肉', '鸡翅', '鸡腿',
            '鸡胸肉', '羊肉', '鱼', '虾', '鸡蛋', '牛腩', '牛腱',
            '肥牛', '牛排', '牛肉丸', '火腿肠', '午餐肉', '虾仁', '虾滑',
            '巴沙鱼', '鲈鱼', '带鱼'
        ]
    },
    {
        title: '水果 / Fruit',
        items: [
            '苹果', '香蕉', '蓝莓', '柠檬', '草莓', '牛油果', '西瓜', '葡萄'
        ]
    }
]

// Quick select common ingredients
const QUICK_SELECT = ['鸡蛋', '西红柿', '鸡胸肉', '土豆', '洋葱', '大蒜', '辣椒', '胡萝卜']

export default function Fridge() {
    const [selected, setSelected] = useState<string[]>([])
    const [inputValue, setInputValue] = useState('')
    const [showQuick, setShowQuick] = useState(true)

    // Load saved ingredients on mount
    // useDidShow(() => {
    //     const saved = Taro.getStorageSync('savedIngredients')
    //     if (saved && Array.isArray(saved)) {
    //         setSelected(saved)
    //     }
    // })

    // Mock Weight Logic
    const totalWeight = useMemo(() => {
        // Arbitrary starting weight - 0.2kg per selected item
        const current = 12.5 - (selected.length * 0.2)
        return current.toFixed(1)
    }, [selected])

    const toggleSelect = (name: string) => {
        if (selected.includes(name)) {
            setSelected(selected.filter(n => n !== name))
        } else {
            setSelected([...selected, name])
        }
    }

    const handleInputConfirm = () => {
        if (inputValue.trim()) {
            toggleSelect(inputValue.trim())
            setInputValue('')
        }
    }

    const handleQuickSelect = (item: string) => {
        toggleSelect(item)
    }

    const handleMatch = () => {
        if (selected.length === 0) {
            Taro.showToast({ title: '先选些食材吧~', icon: 'none' })
            return
        }
        // Save to storage for potential recovery
        Taro.setStorageSync('savedIngredients', selected)
        
        const params = selected.join(',')
        Taro.navigateTo({
            url: `/pages/result/index?auto=true&ingredients=${encodeURIComponent(params)}`
        })
    }

    const handleClear = () => {
        setSelected([])
        Taro.removeStorageSync('savedIngredients')
    }

    // --- STYLES ---
    const S = {
        container: {
            minHeight: '100vh',
            backgroundColor: '#fafafa',
            paddingBottom: '120px',
            boxSizing: 'border-box'
        } as React.CSSProperties,

        // Sticky Header
        stickyHeader: {
            position: 'sticky',
            top: 0,
            backgroundColor: 'rgba(250, 250, 250, 0.98)',
            zIndex: 999,
            padding: '16px 20px 20px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.04)'
        } as React.CSSProperties,

        // Stats Bar
        statsRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
        } as React.CSSProperties,

        pageTitle: {
            fontSize: '20px',
            fontWeight: '700',
            color: '#1a1a2e'
        } as React.CSSProperties,

        weightText: {
            fontSize: '13px',
            color: '#8e8e93',
            fontWeight: '500'
        } as React.CSSProperties,

        barTrack: {
            width: '100%',
            height: '4px',
            backgroundColor: '#f0f0f0',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '16px',
            display: 'flex'
        } as React.CSSProperties,

        // Input Row
        inputRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px'
        } as React.CSSProperties,

        input: {
            flex: 1,
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '12px 18px',
            fontSize: '15px',
            color: '#1a1a2e',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.04)'
        } as React.CSSProperties,

        clearBtn: {
            padding: '10px 16px',
            fontSize: '13px',
            color: '#8e8e93',
            backgroundColor: '#f5f5f5',
            borderRadius: '20px',
            border: 'none'
        } as React.CSSProperties,

        // Quick Select
        quickRow: {
            display: 'flex',
            gap: '8px',
            overflowX: 'auto' as const,
            whiteSpace: 'nowrap' as const,
            paddingBottom: '8px',
            marginBottom: '8px'
        } as React.CSSProperties,

        quickItem: {
            padding: '6px 14px',
            fontSize: '13px',
            backgroundColor: '#fff',
            border: '1px solid #e5e5e5',
            borderRadius: '16px',
            color: '#666'
        } as React.CSSProperties,

        // Selected Area
        selectedScroll: {
            whiteSpace: 'nowrap',
            width: '100%'
        } as React.CSSProperties,

        selectedChip: {
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#fff7ed',
            padding: '8px 14px',
            borderRadius: '20px',
            marginRight: '8px',
            marginBottom: '8px',
            fontSize: '14px',
            color: '#ea580c',
            border: '1px solid rgba(234, 88, 12, 0.2)'
        } as React.CSSProperties,

        closeIcon: {
            marginLeft: '8px',
            color: '#ea580c',
            fontWeight: 'bold',
            fontSize: '16px',
            opacity: 0.7
        } as React.CSSProperties,

        emptySelected: {
            fontSize: '14px',
            color: '#aeaeb2',
            padding: '12px 0',
            textAlign: 'center' as const
        } as React.CSSProperties,

        // Main Grid Area
        gridSection: {
            padding: '20px'
        } as React.CSSProperties,

        catTitle: {
            fontSize: '15px',
            fontWeight: '600',
            color: '#1a1a2e',
            marginBottom: '16px',
            display: 'block',
            textAlign: 'center' as const
        } as React.CSSProperties,

        tagContainer: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '32px',
            justifyContent: 'center'
        } as React.CSSProperties,

        tag: {
            padding: '10px 18px',
            borderRadius: '24px',
            fontSize: '14px',
            backgroundColor: '#ffffff',
            border: '1px solid #f0f0f0',
            color: '#4a4a4a',
            transition: 'all 0.2s ease',
            minWidth: '56px',
            textAlign: 'center' as const
        } as React.CSSProperties,

        tagActive: {
            backgroundColor: '#ff9a56',
            borderColor: '#ff9a56',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(255, 154, 86, 0.3)'
        } as React.CSSProperties,

        // Button
        btnContainer: {
            position: 'fixed',
            bottom: '28px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 1000
        } as React.CSSProperties,

        matchBtn: {
            width: '85%',
            height: '52px',
            borderRadius: '26px',
            backgroundColor: '#ff9a56',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '17px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(255, 154, 86, 0.35)',
            border: 'none'
        } as React.CSSProperties
    }

    return (
        <View style={S.container}>
            {/* Sticky Header */}
            <View style={S.stickyHeader}>
                <View style={S.statsRow}>
                    <Text style={S.pageTitle}>清冰箱</Text>
                    <Text style={S.weightText}>剩余 {totalWeight}kg</Text>
                </View>

                <View style={S.barTrack}>
                    <View style={{ width: '60%', height: '100%', backgroundColor: '#7cb3f3' }} />
                    <View style={{ width: '25%', height: '100%', backgroundColor: '#8ae6c8' }} />
                </View>

                {/* Input + Quick Select */}
                <View style={S.inputRow}>
                    <Input
                        style={S.input}
                        placeholder='添加其他食材...'
                        placeholderStyle='color:#aeaeb2'
                        value={inputValue}
                        onInput={e => setInputValue(e.detail.value)}
                        onConfirm={handleInputConfirm}
                    />
                    {selected.length > 0 && (
                        <Button style={S.clearBtn} onClick={handleClear}>清空</Button>
                    )}
                </View>

                {/* Quick Select Pills */}
                {showQuick && (
                    <ScrollView scrollX style={S.quickRow} showScrollbar={false}>
                        {QUICK_SELECT.map(item => {
                            const isActive = selected.includes(item)
                            return (
                                <View
                                    key={item}
                                    style={{
                                        ...S.quickItem,
                                        ...(isActive ? { backgroundColor: '#fff7ed', borderColor: '#ff9a56', color: '#ff9a56' } : {})
                                    }}
                                    onClick={() => handleQuickSelect(item)}
                                >
                                    {item}
                                </View>
                            )
                        })}
                    </ScrollView>
                )}

                {/* Selected Chips */}
                {selected.length > 0 ? (
                    <ScrollView scrollX style={S.selectedScroll} showScrollbar={false}>
                        <View style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {selected.map(item => (
                                <View key={item} style={S.selectedChip} onClick={() => toggleSelect(item)}>
                                    <Text>{item}</Text>
                                    <Text style={S.closeIcon}>×</Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                ) : (
                    <View style={S.emptySelected}>
                        <Text>点击上方食材或输入添加</Text>
                    </View>
                )}
            </View>

            {/* Categories */}
            <View style={S.gridSection}>
                {CATEGORIES.map((cat, idx) => (
                    <View key={idx}>
                        <Text style={S.catTitle}>{cat.title}</Text>
                        <View style={S.tagContainer}>
                            {cat.items.map(item => {
                                const isActive = selected.includes(item)
                                return (
                                    <View
                                        key={item}
                                        style={{ ...S.tag, ...(isActive ? S.tagActive : {}) }}
                                        onClick={() => toggleSelect(item)}
                                    >
                                        {item}
                                    </View>
                                )
                            })}
                        </View>
                    </View>
                ))}
            </View>

            {/* Floating Button */}
            {selected.length > 0 && (
                <View style={S.btnContainer}>
                    <View style={S.matchBtn} onClick={handleMatch}>
                        帮我搭配 ({selected.length} 种食材)
                    </View>
                </View>
            )}
        </View>
    )
}
