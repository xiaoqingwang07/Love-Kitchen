import { View, Text } from '@tarojs/components'
import { D } from '../theme/designTokens'
import { BackChevron } from './BackChevron'

type Props = {
  title: string
  onBack: () => void
}

/** Tab 内子页顶栏：chevron + 标题，不用「← 返回」文案。 */
export function SubpageHeader({ title, onBack }: Props) {
  return (
    <View
      style={{
        padding: '6px 16px 6px 4px',
        backgroundColor: D.bg,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        borderBottom: `0.5px solid ${D.separatorLight}`,
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
        onClick={onBack}
      >
        <BackChevron color={D.label} size={18} />
      </View>
      <Text
        style={{
          fontSize: 17,
          fontWeight: D.weightSemibold,
          color: D.label,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        {title}
      </Text>
    </View>
  )
}
