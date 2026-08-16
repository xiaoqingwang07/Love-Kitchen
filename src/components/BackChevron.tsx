import { View } from '@tarojs/components'
import { D } from '../theme/designTokens'

type Props = {
  color?: string
  size?: number
}

/** iOS 风格返回箭头：两笔画成的 chevron，不用「←」字符。 */
export function BackChevron({ color = D.label, size = 18 }: Props) {
  const thickness = size >= 18 ? 2 : 1.6
  return (
    <View
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <View
        style={{
          width: size * 0.48,
          height: size * 0.48,
          borderLeft: `${thickness}px solid ${color}`,
          borderBottom: `${thickness}px solid ${color}`,
          transform: 'rotate(45deg)',
          marginLeft: size * 0.18,
        }}
      />
    </View>
  )
}
