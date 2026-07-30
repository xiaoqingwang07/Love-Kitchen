import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useRef } from 'react'
import { AppIcon } from '../../../components/AppIcon'
import { D } from '../../../theme/designTokens'
import * as S from '../styles'

const HOT_WORDS = [
  '番茄炒蛋', '红烧肉', '宫保鸡丁', '麻婆豆腐', '可乐鸡翅',
  '蒜蓉西兰花', '葱油拌面', '皮蛋豆腐', '辣椒炒肉', '鱼香肉丝',
  '土豆炖牛肉', '蒸鸡蛋', '炒青菜', '回锅肉', '白灼虾',
]

type Props = {
  inputValue: string
  onInputChange: (value: string) => void
  onSearch: () => void
  showHistory: boolean
  onShowHistory: (show: boolean) => void
  searchHistory: string[]
  onHistoryClick: (keyword: string) => void
  onClearHistory: () => void
  onPickDish: (source: 'camera' | 'album') => void
  onOpenVoice: () => void
  onHotWordSearch: (word: string) => void
  onFocusLoadHistory: () => void
}

export function HomeSearchBar({
  inputValue,
  onInputChange,
  onSearch,
  showHistory,
  onShowHistory,
  searchHistory,
  onHistoryClick,
  onClearHistory,
  onPickDish,
  onOpenVoice,
  onHotWordSearch,
  onFocusLoadHistory,
}: Props) {
  const skipSearchBlurRef = useRef(false)
  const hasInput = inputValue.trim().length > 0

  return (
    <>
      <View style={S.searchSectionStyle}>
        <View style={S.searchShellStyle}>
          <AppIcon name="search" size={14} color={D.labelTertiary} backgroundColor="transparent" />
          <Input
            style={S.searchInputStyle}
            placeholder="番茄、鸡蛋、鸡胸肉…"
            placeholderStyle={`color: ${D.labelTertiary}`}
            value={inputValue}
            confirmType="search"
            onInput={(e) => onInputChange(e.detail.value)}
            onFocus={() => {
              onFocusLoadHistory()
              onShowHistory(true)
            }}
            onBlur={() => {
              setTimeout(() => {
                if (!skipSearchBlurRef.current) onShowHistory(false)
                skipSearchBlurRef.current = false
              }, 260)
            }}
            onConfirm={onSearch}
          />

          {hasInput ? (
            <View className="tap-scale" style={S.searchSubmitStyle} onClick={onSearch}>
              <Text style={S.searchSubmitTextStyle}>搜索</Text>
            </View>
          ) : (
            <View style={S.searchActionsStyle}>
              <View
                className="tap-scale"
                style={S.searchActionBtnStyle}
                onTouchStart={() => { skipSearchBlurRef.current = true }}
                onClick={() => {
                  Taro.showToast({ title: '语音说出你的食材', icon: 'none', duration: 1500 })
                  onOpenVoice()
                }}
              >
                <AppIcon name="mic" size={16} color={D.accent} backgroundColor="transparent" />
              </View>
              <View
                className="tap-scale"
                style={S.searchActionBtnStyle}
                onTouchStart={() => { skipSearchBlurRef.current = true }}
                onClick={() => onPickDish('album')}
              >
                <AppIcon name="list" size={16} color={D.accent} backgroundColor="transparent" />
              </View>
              <View
                className="tap-scale"
                style={S.searchActionBtnStyle}
                onTouchStart={() => { skipSearchBlurRef.current = true }}
                onClick={() => onPickDish('camera')}
              >
                <AppIcon name="camera" size={16} color={D.accent} backgroundColor="transparent" />
              </View>
            </View>
          )}
        </View>
      </View>

      {showHistory ? (
        <View
          style={S.historyBoxStyle}
          onTouchStart={() => { skipSearchBlurRef.current = true }}
        >
          <View style={S.historyHeaderStyle}>
            <Text style={S.historyTitleStyle}>最近搜索</Text>
            {searchHistory.length > 0 ? (
              <Text
                className="tap-scale"
                style={S.clearBtnStyle}
                onClick={() => {
                  skipSearchBlurRef.current = true
                  onClearHistory()
                }}
              >
                清除
              </Text>
            ) : null}
          </View>
          {searchHistory.length === 0 ? (
            <Text className="lk-block" style={{ fontSize: D.footnote, color: D.labelTertiary, padding: '0 2px 4px' }}>
              还没有记录，搜一次就会出现在这里
            </Text>
          ) : (
            <View style={S.historyListStyle}>
              {searchHistory.slice(0, 8).map((keyword, idx) => (
                <View
                  key={idx}
                  className="tap-scale"
                  style={S.historyTagStyle}
                  onTouchStart={() => { skipSearchBlurRef.current = true }}
                  onClick={() => onHistoryClick(keyword)}
                >
                  <Text>{keyword}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: D.caption, color: D.labelTertiary, letterSpacing: '0.08em', marginBottom: 8, display: 'block' }}>
              大家都在搜
            </Text>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {HOT_WORDS.map((word) => (
                <View
                  key={word}
                  className="tap-scale"
                  style={{
                    padding: '5px 12px',
                    backgroundColor: D.bgElevated,
                    border: `0.5px solid ${D.separatorLight}`,
                    borderRadius: 99,
                  }}
                  onTouchStart={() => { skipSearchBlurRef.current = true }}
                  onClick={() => {
                    skipSearchBlurRef.current = true
                    onShowHistory(false)
                    onHotWordSearch(word)
                  }}
                >
                  <Text style={{ fontSize: D.footnote, color: D.label }}>{word}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : null}
    </>
  )
}
