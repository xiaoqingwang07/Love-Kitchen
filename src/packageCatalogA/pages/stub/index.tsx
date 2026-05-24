import '../../bridge'
import { View } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'

/** 分包占位页：onLoad 时确保 bridge 已注册 */
export default function CatalogStubA() {
  useLoad(() => {
    /* bridge 模块 import 时已注册；useLoad 保证页面被打开时再次可用 */
  })
  return <View />
}
