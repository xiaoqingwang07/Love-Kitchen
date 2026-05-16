import { Component, type ReactNode } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { D } from '../theme/designTokens'

interface Props {
  children: ReactNode
  /** 降级 UI 标题，默认"出了点小问题" */
  title?: string
}

interface State {
  hasError: boolean
  errorMsg: string
}

/**
 * App 级 ErrorBoundary：捕获子树中的未处理 JS 异常，展示友好错误页。
 * 避免因单页崩溃导致整个 App 白屏。
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMsg: '' }
  }

  static getDerivedStateFromError(error: unknown): State {
    const msg = error instanceof Error ? error.message : String(error)
    return { hasError: true, errorMsg: msg }
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMsg: '' })
  }

  handleGoHome = () => {
    this.setState({ hasError: false, errorMsg: '' })
    Taro.switchTab({ url: '/pages/index/index' })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }
    return (
      <View style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        padding: '48rpx', backgroundColor: D.bg,
      }}>
        <Text style={{ fontSize: '64rpx', marginBottom: '24rpx' }}>😅</Text>
        <Text style={{
          fontSize: '32rpx', fontWeight: D.weightSemibold, color: D.label,
          marginBottom: '16rpx', textAlign: 'center',
        }}>
          {this.props.title ?? '出了点小问题'}
        </Text>
        <Text style={{
          fontSize: '24rpx', color: D.labelSecondary, textAlign: 'center',
          lineHeight: '40rpx', marginBottom: '48rpx',
          maxWidth: '560rpx',
        }}>
          {this.state.errorMsg || '页面遇到了意外错误，请尝试重试或返回首页。'}
        </Text>
        <Button
          onClick={this.handleRetry}
          style={{
            backgroundColor: D.accent, color: '#FFF',
            borderRadius: '48rpx', padding: '24rpx 64rpx',
            fontSize: '28rpx', marginBottom: '20rpx',
            border: 'none',
          }}
        >
          重试
        </Button>
        <Button
          onClick={this.handleGoHome}
          style={{
            backgroundColor: 'transparent', color: D.accent,
            borderRadius: '48rpx', padding: '20rpx 64rpx',
            fontSize: '28rpx',
            border: `2rpx solid ${D.accent}`,
          }}
        >
          返回首页
        </Button>
      </View>
    )
  }
}
