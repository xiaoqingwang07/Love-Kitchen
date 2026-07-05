import { View } from '@tarojs/components'
import { D } from '../theme/designTokens'

/** 折叠面板展开指示，避免用文本符号充当控件图标。 */
export function ExpandChevron({ expanded }: { expanded: boolean }) {
  return (
    <View
      style={{
        width: 14,
        height: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <View
        style={{
          width: 7,
          height: 7,
          borderRight: `1.5px solid ${D.labelTertiary}`,
          borderBottom: `1.5px solid ${D.labelTertiary}`,
          transform: expanded ? 'rotate(45deg)' : 'rotate(-45deg)',
          marginTop: expanded ? -2 : 0,
        }}
      />
    </View>
  )
}
