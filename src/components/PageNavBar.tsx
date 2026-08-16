import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { D } from '../theme/designTokens'
import { BackChevron } from './BackChevron'

type Props = {
  title: string
  onBack?: () => void
}

function navMetrics() {
  try {
    const sys = Taro.getSystemInfoSync()
    const statusBarHeight = sys.statusBarHeight || 0
    const weapp = process.env.TARO_ENV === 'weapp'
    const menu =
      weapp && typeof Taro.getMenuButtonBoundingClientRect === 'function'
        ? Taro.getMenuButtonBoundingClientRect()
        : null
    if (menu && menu.height > 0 && menu.top > statusBarHeight) {
      return {
        statusBarHeight,
        navHeight: (menu.top - statusBarHeight) * 2 + menu.height,
        sideInset: Math.max(sys.windowWidth - menu.left + 8, 88),
      }
    }
    return { statusBarHeight: weapp ? statusBarHeight : 0, navHeight: 44, sideInset: 16 }
  } catch {
    return { statusBarHeight: 0, navHeight: 44, sideInset: 16 }
  }
}

function goBack(onBack?: () => void) {
  if (onBack) {
    onBack()
    return
  }
  const pages = Taro.getCurrentPages()
  if (pages.length > 1) {
    Taro.navigateBack()
    return
  }
  Taro.switchTab({ url: '/pages/index/index' })
}

/** 自定义顶栏：44pt 命中区 + SF 式 chevron，避开右侧胶囊。 */
export function PageNavBar({ title, onBack }: Props) {
  const { statusBarHeight, navHeight, sideInset } = navMetrics()

  return (
    <View
      style={{
        paddingTop: statusBarHeight,
        backgroundColor: D.bg,
      }}
    >
      <View
        style={{
          height: navHeight,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 4,
          paddingRight: sideInset,
        }}
      >
        <View
          className="tap-scale"
          style={{
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          onClick={() => goBack(onBack)}
        >
          <BackChevron color={D.label} size={18} />
        </View>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 17,
            fontWeight: D.weightSemibold,
            color: D.label,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View style={{ width: 44, flexShrink: 0 }} />
      </View>
    </View>
  )
}
