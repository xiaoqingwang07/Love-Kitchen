import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import { D } from '../theme/designTokens'
import { createRecorder, saveIntakeDraft } from '../utils/mediaIntake'

type Props = {
  visible: boolean
  onClose: () => void
  /** 录制结束后回调：拿到音频路径与时长 */
  onRecorded: (filePath: string, durationMs: number) => void
}

/**
 * 按住说话弹层：iOS 风格的录音交互
 * - 按下开始，松开结束；时长 < 500ms 视为误触
 * - 微信小程序需在 app.json 中声明 scope.record 授权（授权失败会有系统弹窗）
 */
export function VoiceRecorderSheet({ visible, onClose, onRecorded }: Props) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const recorderRef = useRef<ReturnType<typeof createRecorder>>(null)
  const startAtRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!visible) return
    const recorder = createRecorder()
    recorderRef.current = recorder
    if (!recorder) return

    const onStop = (res: { tempFilePath?: string; duration?: number }) => {
      setRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      const duration = Number(res.duration ?? Date.now() - startAtRef.current) || 0
      const path = res.tempFilePath || ''
      if (!path || duration < 500) {
        Taro.showToast({ title: '录音太短', icon: 'none' })
        return
      }
      saveIntakeDraft({
        kind: 'voice',
        filePath: path,
        capturedAt: Date.now(),
        durationMs: duration,
      })
      onRecorded(path, duration)
    }
    const onError = () => {
      setRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      Taro.showToast({ title: '麦克风未授权', icon: 'none' })
    }
    recorder.onStop(onStop)
    recorder.onError(onError)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      try {
        recorder.stop()
      } catch {
        /* ignore */
      }
    }
  }, [visible])

  const handleStart = () => {
    const recorder = recorderRef.current
    if (!recorder) return
    setSeconds(0)
    startAtRef.current = Date.now()
    try {
      recorder.start({
        duration: 30000,
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 48000,
        format: 'mp3',
      })
      setRecording(true)
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startAtRef.current) / 1000)
        setSeconds(elapsed)
      }, 250)
    } catch {
      Taro.showToast({ title: '启动失败', icon: 'none' })
    }
  }

  const handleStop = () => {
    const recorder = recorderRef.current
    if (!recorder) return
    try {
      recorder.stop()
    } catch {
      /* ignore */
    }
  }

  if (!visible) return null

  return (
    <View
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(18,17,15,0.55)',
        zIndex: 400,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <View
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: D.bgElevated,
          borderTopLeftRadius: D.radiusXL,
          borderTopRightRadius: D.radiusXL,
          padding: `24px ${D.pagePadH}px`,
          paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
          boxShadow: D.shadowLift,
        }}
      >
        <View
          style={{
            alignSelf: 'center',
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: D.separator,
            margin: '0 auto 20px',
          }}
        />
        <Text
          style={{
            display: 'block',
            textAlign: 'center',
            fontSize: D.headline,
            fontWeight: D.weightSemibold,
            color: D.label,
          }}
        >
          {recording ? '正在录音…' : '按住说话'}
        </Text>
        <Text
          style={{
            display: 'block',
            textAlign: 'center',
            fontSize: D.footnote,
            color: D.labelTertiary,
            marginTop: 6,
          }}
        >
          例如「买了两个番茄、半斤排骨」
        </Text>

        <View
          onTouchStart={handleStart}
          onTouchEnd={handleStop}
          onTouchCancel={handleStop}
          style={{
            margin: '28px auto 8px',
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: recording ? D.accentWarm : D.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: recording ? '0 0 0 10px rgba(196,148,74,0.22)' : D.shadowLift,
            transition: 'background-color 200ms ease, box-shadow 200ms ease',
          }}
        >
          <Text style={{ fontSize: 42, color: '#fff' }}>🎙</Text>
        </View>

        <Text
          style={{
            display: 'block',
            textAlign: 'center',
            fontSize: D.title,
            fontWeight: D.weightBold,
            color: recording ? D.accentWarm : D.labelTertiary,
            fontFamily: 'monospace',
            marginTop: 16,
          }}
        >
          {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
        </Text>

        <Text
          style={{
            display: 'block',
            textAlign: 'center',
            fontSize: D.caption,
            color: D.labelTertiary,
            marginTop: 20,
            lineHeight: 1.5,
          }}
          onClick={onClose}
        >
          松开保存为备忘，去冰箱继续录入
        </Text>
      </View>
    </View>
  )
}
