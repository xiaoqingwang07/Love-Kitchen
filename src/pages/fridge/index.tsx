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

export default function Fridge() {
    const [selected, setSelected] = useState<string[]>([])
    const [inputValue, setInputValue] = useState('')

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

    const handleMatch = () => {
        if (selected.length === 0) return
        const params = selected.join(',')
        Taro.navigateTo({
            url: `/pages/result/index?auto=true&ingredients=${encodeURIComponent(params)}`
        })
    }

    // --- STYLES ---
    const S = {
        container: {
            minHeight: '100vh',
            backgroundColor: '#fff',
            paddingBottom: '100px',
            boxSizing: 'border-box'
        } as React.CSSProperties,

        // Sticky Header
        stickyHeader: {
            position: 'sticky',
            top: 0,
            backgroundColor: 'rgba(255,255,255,0.98)',
            zIndex: 999,
            padding: '12px 16px 16px',
            borderBottom: '1px solid #f5f5f5'
        } as React.CSSProperties,

        // Stats Bar
        statsRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
        } as React.CSSProperties,

        pageTitle: {
            fontSize: '18px',
            fontWeight: '800',
            color: '#1a1a1a'
        } as React.CSSProperties,

        weightText: {
            fontSize: '12px',
            color: '#666',
            fontWeight: '500'
        } as React.CSSProperties,

        barTrack: {
            width: '100%',
            height: '6px',
            backgroundColor: '#f0f0f0',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '16px',
            display: 'flex'
        } as React.CSSProperties,

        // Input
        input: {
            backgroundColor: '#f7f7f7',
            borderRadius: '99px',
            padding: '10px 20px',
            fontSize: '14px',
            width: '100%',
            boxSizing: 'border-box',
            marginBottom: '12px'
        } as React.CSSProperties,

        // Selected Area
        selectedScroll: {
            whiteSpace: 'nowrap',
            width: '100%'
        } as React.CSSProperties,

        selectedChip: {
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#f3f4f6',
            padding: '6px 12px',
            borderRadius: '20px',
            marginRight: '8px',
            fontSize: '12px',
            color: '#333'
        } as React.CSSProperties,

        closeIcon: {
            marginLeft: '6px',
            color: '#999',
            fontWeight: 'bold',
            fontSize: '14px'
        } as React.CSSProperties,

        // Main Grid Area
        gridSection: {
            padding: '24px 16px'
        } as React.CSSProperties,

        catTitle: {
            fontSize: '15px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '16px',
            display: 'block',
            textAlign: 'center'
        } as React.CSSProperties,

        tagContainer: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '32px',
            justifyContent: 'center'
        } as React.CSSProperties,

        tag: {
            padding: '8px 16px',
            borderRadius: '24px',
            fontSize: '13px',
            backgroundColor: '#fff',
            border: '1px solid #eee',
            color: '#333',
            transition: 'all 0.2s ease',
            minWidth: '60px',
            textAlign: 'center'
        } as React.CSSProperties,

        tagActive: {
            backgroundColor: '#ea580c', // Orange-600
            borderColor: '#ea580c',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(234, 88, 12, 0.2)'
        } as React.CSSProperties,

        // Button
        btnContainer: {
            position: 'fixed',
            bottom: '24px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 1000
        } as React.CSSProperties,

        matchBtn: {
            width: '80%',
            height: '48px',
            borderRadius: '99px',
            backgroundColor: '#fff7ed', // Orange-50
            color: '#ea580c',          // Orange-600
            fontWeight: 'bold',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(234, 88, 12, 0.15)',
            border: '1px solid rgba(234, 88, 12, 0.1)'
        } as React.CSSProperties
    }

    return (
        <View style={S.container}>
            {/* Sticky Header */}
            <View style={S.stickyHeader}>
                <View style={S.statsRow}>
                    <Text style={S.pageTitle}>选菜匹配</Text>
                    <Text style={S.weightText}>剩余 {totalWeight}kg</Text>
                </View>

                <View style={S.barTrack}>
                    <View style={{ width: '60%', height: '100%', backgroundColor: '#60a5fa' }} />
                    <View style={{ width: '25%', height: '100%', backgroundColor: '#a78bfa' }} />
                </View>

                <Input
                    style={S.input}
                    placeholder='输入其他食材...'
                    placeholderStyle='color:#bbb'
                    value={inputValue}
                    onInput={e => setInputValue(e.detail.value)}
                    onConfirm={handleInputConfirm}
                />

                {/* Selected Chips */}
                {selected.length > 0 && (
                    <ScrollView scrollX style={S.selectedScroll}>
                        <View style={{ display: 'flex' }}>
                            {selected.map(item => (
                                <View key={item} style={S.selectedChip} onClick={() => toggleSelect(item)}>
                                    <Text>{item}</Text>
                                    <Text style={S.closeIcon}>×</Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
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
                        匹配菜谱 ({selected.length})
                    </View>
                </View>
            )}
        </View>
    )
}