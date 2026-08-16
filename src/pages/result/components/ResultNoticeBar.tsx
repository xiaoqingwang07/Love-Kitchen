import { View, Text } from '@tarojs/components'
import type { ErrorNotice } from '../resultUtils'
import { noticeBoxStyle, noticeDetailStyle, noticeTitleStyle } from '../resultPageStyles'

type Props = {
  notice: ErrorNotice
}

export function ResultNoticeBar({ notice }: Props) {
  return (
    <View style={noticeBoxStyle(notice.tone)}>
      <Text style={{ fontSize: 15, lineHeight: 1 }}>
        {notice.tone === 'warn' ? '!' : '·'}
      </Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text className="lk-block" style={noticeTitleStyle(notice.tone)}>
          {notice.title}
        </Text>
        <Text className="lk-block" style={noticeDetailStyle}>
          {notice.detail}
        </Text>
      </View>
    </View>
  )
}
