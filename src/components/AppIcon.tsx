import { View, Text, Image } from '@tarojs/components'
import type { CSSProperties } from 'react'
import { D } from '../theme/designTokens'

/** 核心功能图标（PNG 优先，缺失时回退 glyph） */
export type AppIconName =
  | 'camera'
  | 'meal'
  | 'search'
  | 'mic'
  | 'cart'
  | 'fridge'
  | 'share'
  | 'add'
  | 'cook'
  | 'list'
  | 'home'
  | 'heart'

const GLYPH: Record<AppIconName, string> = {
  camera: '拍',
  meal: '餐',
  search: '搜',
  mic: '说',
  cart: '购',
  fridge: '藏',
  share: '享',
  add: '+',
  cook: '做',
  list: '单',
  home: '家',
  heart: '♥',
}

/** 由 scripts/generate-app-icons.mjs 生成 */
const ICON_PNG: Partial<Record<AppIconName, string>> = {
  camera: require('../assets/icons/camera.png'),
  meal: require('../assets/icons/meal.png'),
  search: require('../assets/icons/search.png'),
  mic: require('../assets/icons/mic.png'),
  cart: require('../assets/icons/cart.png'),
  fridge: require('../assets/icons/fridge.png'),
  share: require('../assets/icons/share.png'),
  add: require('../assets/icons/add.png'),
  cook: require('../assets/icons/cook.png'),
  list: require('../assets/icons/list.png'),
  home: require('../assets/icons/home.png'),
  heart: require('../assets/icons/heart.png'),
}

type Props = {
  name: AppIconName
  size?: number
  color?: string
  backgroundColor?: string
  style?: CSSProperties
  /** 强制文字 glyph，忽略 PNG */
  glyphOnly?: boolean
}

export function AppIcon({
  name,
  size = 20,
  color = D.label,
  backgroundColor = D.accentMuted,
  style,
  glyphOnly = false,
}: Props) {
  const box = Math.round(size * 1.35)
  const png = !glyphOnly ? ICON_PNG[name] : undefined

  if (png) {
    return (
      <Image
        src={png}
        mode="aspectFit"
        style={{
          width: box,
          height: box,
          flexShrink: 0,
          ...style,
        }}
      />
    )
  }

  return (
    <View
      style={{
        width: box,
        height: box,
        borderRadius: box / 4,
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      <Text
        style={{
          fontSize: size * 0.55,
          fontWeight: D.weightBold,
          color,
          lineHeight: 1,
        }}
      >
        {GLYPH[name]}
      </Text>
    </View>
  )
}
