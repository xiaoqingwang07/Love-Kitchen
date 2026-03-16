/**
 * 通用样式组件
 * 抽离重复的样式代码
 */
import React from 'react'
import { View, Text, Image, Button, ActivityIndicator } from '@tarojs/components'

// ============ 加载状态 ============
interface LoadingProps {
  text?: string
  emoji?: string
}

export const Loading: React.FC<LoadingProps> = ({ 
  text = '加载中...', 
  emoji = '⏳' 
}) => (
  <View style={{
    height: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column'
  }}>
    <Text style={{ fontSize: '48px', marginBottom: '16px' }}>{emoji}</Text>
    <Text style={{ color: '#8e8e93', fontSize: '15px', fontWeight: '500' }}>{text}</Text>
  </View>
)

// ============ 空状态 ============
interface EmptyProps {
  emoji?: string
  title: string
  desc?: string
  action?: {
    text: string
    onClick: () => void
  }
}

export const Empty: React.FC<EmptyProps> = ({ 
  emoji = '📭', 
  title, 
  desc, 
  action 
}) => (
  <View style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '80px'
  }}>
    <Text style={{ fontSize: '64px', marginBottom: '20px' }}>{emoji}</Text>
    <Text style={{ 
      fontSize: '18px', 
      fontWeight: '600', 
      color: '#1a1a2e',
      marginBottom: '8px'
    }}>{title}</Text>
    {desc && (
      <Text style={{ 
        fontSize: '14px', 
        color: '#aeaeb2',
        textAlign: 'center',
        padding: '0 40px'
      }}>{desc}</Text>
    )}
    {action && (
      <View style={{ marginTop: '20px' }}>
        <Button 
          onClick={action.onClick}
          style={{
            backgroundColor: '#f97316',
            color: 'white',
            borderRadius: '999px',
            padding: '10px 24px',
            fontSize: '14px'
          }}
        >
          {action.text}
        </Button>
      </View>
    )}
  </View>
)

// ============ 错误提示 ============
interface ErrorBoxProps {
  message: string
  onRetry?: () => void
}

export const ErrorBox: React.FC<ErrorBoxProps> = ({ message, onRetry }) => (
  <View style={{
    backgroundColor: '#fff7ed',
    borderRadius: '12px',
    padding: '14px 16px',
    marginBottom: '16px',
    borderLeft: '3px solid #ff9a56'
  }}>
    <Text style={{ fontSize: '14px', color: '#ea580c' }}>{message}</Text>
    {onRetry && (
      <Text 
        onClick={onRetry}
        style={{ 
          fontSize: '13px', 
          color: '#f97316', 
          marginTop: '8px',
          textDecoration: 'underline'
        }}
      >
        点这里重试
      </Text>
    )}
  </View>
)

// ============ 菜谱卡片 ============
interface RecipeCardProps {
  recipe: {
    id?: number | string
    title: string
    emoji?: string
    quote?: string
    rating?: number
    count?: number
    time?: number
    isFavorite?: boolean
  }
  onClick: () => void
  onFavorite: () => void
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ 
  recipe, 
  onClick, 
  onFavorite 
}) => (
  <View 
    onClick={onClick}
    style={{
      backgroundColor: '#ffffff',
      borderRadius: '18px',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(0, 0, 0, 0.02)'
    }}
  >
    {/* 封面 */}
    <View style={{
      width: '72px',
      height: '72px',
      backgroundColor: '#fff7ed',
      borderRadius: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '36px',
      flexShrink: 0
    }}>
      <Text>{recipe.emoji || '🥘'}</Text>
    </View>
    
    {/* 信息 */}
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={{
        fontSize: '16px',
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: '4px',
        display: 'block'
      }}>{recipe.title}</Text>
      
      {recipe.quote && (
        <Text style={{
          fontSize: '13px',
          color: '#ff9a56',
          fontStyle: 'italic',
          marginBottom: '8px',
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>"{recipe.quote}"</Text>
      )}
      
      {/* 元信息 */}
      <View style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {recipe.rating && (
          <View style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            backgroundColor: '#fffbeb',
            padding: '2px 8px',
            borderRadius: '6px'
          }}>
            <Text style={{ fontSize: '12px', color: '#fbbf24' }}>★</Text>
            <Text style={{ fontSize: '12px', fontWeight: '600', color: '#d97706' }}>
              {recipe.rating}
            </Text>
          </View>
        )}
        <Text style={{ fontSize: '12px', color: '#aeaeb2' }}>
          {recipe.count ? `${recipe.count}人做过` : '新品'}
        </Text>
        {recipe.time && (
          <Text style={{ fontSize: '12px', color: '#aeaeb2' }}>
            {recipe.time}分钟
          </Text>
        )}
      </View>
    </View>
    
    {/* 收藏按钮 */}
    <View 
      onClick={(e) => {
        e.stopPropagation()
        onFavorite()
      }}
      style={{ padding: '8px', fontSize: '20px' }}
    >
      <Text>{recipe.isFavorite ? '❤️' : '🤍'}</Text>
    </View>
  </View>
)

// ============ 按钮 ============
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  loading?: boolean
  style?: React.CSSProperties
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick,
  variant = 'primary',
  disabled,
  loading,
  style 
}) => {
  const baseStyle = {
    height: '50px',
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    border: 'none' as const
  }
  
  const variants = {
    primary: {
      backgroundColor: disabled ? '#ccc' : '#f97316',
      color: 'white',
      boxShadow: disabled ? 'none' : '0 4px 12px rgba(249, 115, 22, 0.3)'
    },
    secondary: {
      backgroundColor: '#f3f4f6',
      color: '#374151'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#f97316'
    }
  }
  
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...baseStyle,
        ...variants[variant],
        ...style
      }}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : children}
    </Button>
  )
}
