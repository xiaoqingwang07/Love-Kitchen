import { View } from '@tarojs/components'
import type { CSSProperties } from 'react'
import { D } from '../theme/designTokens'

type BlockProps = {
  height?: number | string
  width?: number | string
  radius?: number
  style?: CSSProperties
}

/** 单块骨架：用于标题/副标题/小块占位 */
export function SkeletonBlock({ height = 14, width = '100%', radius = 8, style }: BlockProps) {
  return (
    <View
      className="lk-skeleton"
      style={{
        height,
        width,
        borderRadius: radius,
        ...style,
      }}
    />
  )
}

/** 列表卡骨架：和结果页 recipe 卡一致的布局 */
export function SkeletonRecipeCard() {
  return (
    <View
      style={{
        backgroundColor: D.bgElevated,
        borderRadius: D.radiusL,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        border: `0.5px solid ${D.separatorLight}`,
        boxShadow: D.shadowCard,
      }}
    >
      <View
        className="lk-skeleton"
        style={{ width: 92, height: 92, borderRadius: D.radiusM, flexShrink: 0 }}
      />
      <View style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SkeletonBlock width="68%" height={16} />
        <SkeletonBlock width="95%" height={12} />
        <SkeletonBlock width="40%" height={12} />
      </View>
    </View>
  )
}

/** 列表占位：n 条骨架卡片 */
export function SkeletonRecipeList({ count = 4 }: { count?: number }) {
  return (
    <View style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRecipeCard key={i} />
      ))}
    </View>
  )
}
