/**
 * 冰箱页样式
 */
import Taro from '@tarojs/taro'
import { useState, useMemo } from 'react'
import { getSearchHistory, addSearchHistory } from '../../store'

// Categories from the reference image
const CATEGORIES = [
  {
    title: '蔬菜 / Veggie',
    items: ['芋头', '木耳', '豆芽', '金针菇', '藕', '青菜', '白萝卜', '西葫芦', '生菜', '香菇', '娃娃菜', '丝瓜', '红薯', '豆角', '粉丝', '莴笋', '包菜', '芹菜', '杏鲍菇', '山药', '油麦菜', '油菜', '韭菜', '苦瓜', '平菇']
  },
  {
    title: '肉类 / Meat',
    items: ['猪肉', '排骨', '五花肉', '牛肉', '鸡肉', '鸡翅', '鸡腿', '鸡胸肉', '羊肉', '鱼', '虾', '鸡蛋', '牛腩', '牛腱', '肥牛', '牛排', '牛肉丸', '火腿肠', '午餐肉', '虾仁', '虾滑', '巴沙鱼', '鲈鱼', '带鱼']
  },
  {
    title: '水果 / Fruit',
    items: ['苹果', '香蕉', '蓝莓', '柠檬', '草莓', '牛油果', '西瓜', '葡萄']
  }
]

// Quick select common ingredients
const QUICK_SELECT = ['鸡蛋', '西红柿', '鸡胸肉', '土豆', '洋葱', '大蒜', '辣椒', '胡萝卜']

// ============ 样式定义 ============
export const useStyles = () => {
  return useMemo(() => ({
    container: {
      minHeight: '100vh',
      backgroundColor: '#fafafa',
      paddingBottom: '120px'
    } as React.CSSProperties,
    header: {
      padding: '20px',
      backgroundColor: '#fff'
    } as React.CSSProperties,
    headerTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    } as React.CSSProperties,
    backBtn: {
      fontSize: '16px',
      color: '#f97316',
      padding: '8px'
    } as React.CSSProperties,
    pageTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1a1a2e'
    } as React.CSSProperties,
    tabRow: {
      display: 'flex',
      gap: '12px',
      marginBottom: '16px'
    } as React.CSSProperties,
    tab: {
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '500'
    } as React.CSSProperties,
    tabActive: {
      backgroundColor: '#f97316',
      color: '#fff'
    } as React.CSSProperties,
    tabInactive: {
      backgroundColor: '#f3f4f6',
      color: '#6b7280'
    } as React.CSSProperties,
    statsRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    } as React.CSSProperties,
    selectedCount: {
      fontSize: '14px',
      color: '#8e8e93'
    } as React.CSSProperties,
    clearBtn: {
      fontSize: '13px',
      color: '#ef4444'
    } as React.CSSProperties,
    inputRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '16px'
    } as React.CSSProperties,
    input: {
      flex: 1,
      height: '44px',
      backgroundColor: '#f3f4f6',
      borderRadius: '22px',
      padding: '0 16px',
      fontSize: '15px'
    } as React.CSSProperties,
    quickRow: {
      display: 'flex',
      gap: '8px',
      marginBottom: '20px',
      flexWrap: 'wrap' as const
    } as React.CSSProperties,
    quickTag: {
      padding: '6px 12px',
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '13px',
      color: '#4b5563'
    } as React.CSSProperties,
    categoryTitle: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '12px'
    } as React.CSSProperties,
    categoryGrid: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px',
      marginBottom: '24px'
    } as React.CSSProperties,
    ingredientTag: {
      padding: '8px 14px',
      borderRadius: '10px',
      fontSize: '14px',
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      color: '#4b5563'
    } as React.CSSProperties,
    ingredientTagActive: {
      backgroundColor: '#f97316',
      border: '1px solid #f97316',
      color: '#fff'
    } as React.CSSProperties,
    bottomBar: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      backgroundColor: '#fff',
      padding: '16px 20px',
      paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
      boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.06)',
      display: 'flex',
      gap: '12px',
      boxSizing: 'border-box'
    } as React.CSSProperties,
    matchBtn: {
      flex: 1,
      height: '50px',
      backgroundColor: '#f97316',
      borderRadius: '25px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: '16px',
      fontWeight: '600',
      border: 'none' as const
    } as React.CSSProperties,
    selectedBar: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap' as const,
      marginBottom: '16px'
    } as React.CSSProperties,
    selectedTag: {
      padding: '6px 12px',
      backgroundColor: '#f97316',
      borderRadius: '8px',
      fontSize: '13px',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    } as React.CSSProperties,
    removeTag: {
      fontSize: '14px',
      opacity: 0.8
    } as React.CSSProperties,
    cookedSection: {
      padding: '16px 20px'
    } as React.CSSProperties,
    cookedTitle: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '12px'
    } as React.CSSProperties,
    cookedList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    } as React.CSSProperties,
    cookedCard: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    } as React.CSSProperties,
    cookedEmoji: {
      fontSize: '24px'
    } as React.CSSProperties,
    cookedInfo: {
      flex: 1
    } as React.CSSProperties,
    cookedName: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#1a1a2e'
    } as React.CSSProperties,
    cookedTime: {
      fontSize: '12px',
      color: '#8e8e93',
      marginTop: '2px'
    } as React.CSSProperties
  }), [])
}

export { CATEGORIES, QUICK_SELECT }
