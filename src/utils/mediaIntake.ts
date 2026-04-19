/**
 * 媒体采集工具：承接首页搜索框的「拍照 / 相册 / 语音」入口，
 * 把采集到的临时文件写入统一的 storage key，再由冰箱页接入「小票 / 备忘入库」流程。
 *
 * 设计原则：
 * 1. 即使无 OCR/ASR 后端，UI 也要是可用的、不留"道歉文案"；
 * 2. 采集后总是跳转到冰箱页，由用户核对并补充文本；
 * 3. 仅保留最近一次采集，避免 Storage 膨胀。
 */
import Taro from '@tarojs/taro'

export const INTAKE_STORAGE_KEY = 'lk_intake_draft'

export type IntakeKind = 'photo' | 'album' | 'voice'

export interface IntakeDraft {
  kind: IntakeKind
  /** 临时文件路径；voice 为音频文件，photo/album 为图片 */
  filePath: string
  /** 采集时间戳 */
  capturedAt: number
  /** 音频时长（ms），仅 voice 有意义 */
  durationMs?: number
}

export function saveIntakeDraft(draft: IntakeDraft): void {
  try {
    Taro.setStorageSync(INTAKE_STORAGE_KEY, draft)
  } catch (e) {
    console.error('saveIntakeDraft failed', e)
  }
}

export function readIntakeDraft(): IntakeDraft | null {
  try {
    const raw = Taro.getStorageSync(INTAKE_STORAGE_KEY) as IntakeDraft | ''
    if (!raw || typeof raw !== 'object') return null
    return raw as IntakeDraft
  } catch {
    return null
  }
}

export function clearIntakeDraft(): void {
  try {
    Taro.removeStorageSync(INTAKE_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** 拍照或相册选图：统一走 chooseMedia；失败或取消返回 null */
export async function pickImageForIntake(source: 'camera' | 'album'): Promise<IntakeDraft | null> {
  try {
    const res = await Taro.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: [source],
      sizeType: ['compressed'],
      camera: 'back',
    })
    const file = res.tempFiles?.[0]
    if (!file?.tempFilePath) return null
    const draft: IntakeDraft = {
      kind: source === 'camera' ? 'photo' : 'album',
      filePath: file.tempFilePath,
      capturedAt: Date.now(),
    }
    saveIntakeDraft(draft)
    return draft
  } catch {
    return null
  }
}

/** 录音并保存为草稿；recorder 由调用方创建并控制开始/停止 */
export function createRecorder(): ReturnType<typeof Taro.getRecorderManager> | null {
  try {
    return Taro.getRecorderManager()
  } catch (e) {
    console.warn('recorder unavailable', e)
    return null
  }
}
