/**
 * 语音转文字（ASR）：封装微信「同声传译」插件 WechatSI 的实时语音识别。
 *
 * 用法：插件需先在公众平台「设置-第三方设置-插件管理」添加，并在 app.config.ts
 * 的 plugins 中声明（provider=wx069ba97219f66d99）。未添加时 isAsrAvailable()
 * 返回 false，调用方应回退到「录音存备忘」旧逻辑。
 *
 * 识别为实时流式：start() 开始边说边识别，stop() 后 onStop 回调给出最终文本。
 */
import Taro from '@tarojs/taro'

export interface AsrManager {
  start: (opts?: { lang?: string; duration?: number }) => void
  stop: () => void
  /** 注册最终结果回调（停止后触发） */
  onStop: (cb: (text: string) => void) => void
  /** 注册识别中回调（可选，用于实时字幕） */
  onRecognize: (cb: (text: string) => void) => void
  onError: (cb: (msg: string) => void) => void
}

interface RawManager {
  start: (opts: { lang: string; duration?: number }) => void
  stop: () => void
  onStart?: (cb: (res: unknown) => void) => void
  onStop: (cb: (res: { result?: string }) => void) => void
  onRecognize: (cb: (res: { result?: string }) => void) => void
  onError: (cb: (res: { msg?: string }) => void) => void
}

function getPlugin(): { getRecordRecognitionManager?: () => RawManager } | null {
  try {
    const req = (Taro as unknown as { requirePlugin?: (name: string) => unknown }).requirePlugin
    if (typeof req !== 'function') return null
    return req('WechatSI') as { getRecordRecognitionManager?: () => RawManager }
  } catch {
    return null
  }
}

/** 插件是否可用（已添加并可创建识别管理器） */
export function isAsrAvailable(): boolean {
  const plugin = getPlugin()
  return !!plugin && typeof plugin.getRecordRecognitionManager === 'function'
}

/** 创建一个 ASR 管理器；不可用时返回 null */
export function createAsrManager(): AsrManager | null {
  const plugin = getPlugin()
  if (!plugin?.getRecordRecognitionManager) return null

  let raw: RawManager
  try {
    raw = plugin.getRecordRecognitionManager()
  } catch {
    return null
  }

  return {
    start(opts) {
      raw.start({ lang: opts?.lang ?? 'zh_CN', duration: opts?.duration ?? 30000 })
    },
    stop() {
      try {
        raw.stop()
      } catch {
        /* ignore */
      }
    },
    onStop(cb) {
      raw.onStop((res) => cb((res?.result || '').trim()))
    },
    onRecognize(cb) {
      raw.onRecognize((res) => cb((res?.result || '').trim()))
    },
    onError(cb) {
      raw.onError((res) => cb(res?.msg || '识别失败'))
    },
  }
}
