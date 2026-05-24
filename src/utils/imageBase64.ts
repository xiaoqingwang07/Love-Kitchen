import Taro from '@tarojs/taro'

/** 小程序临时图片 → data URL（供视觉模型使用） */
export function readImageAsDataUrl(filePath: string): string {
  const fs = Taro.getFileSystemManager()
  const base64 = fs.readFileSync(filePath, 'base64') as string
  const lower = filePath.toLowerCase()
  const mime = lower.includes('.png') ? 'image/png' : 'image/jpeg'
  return `data:${mime};base64,${base64}`
}
