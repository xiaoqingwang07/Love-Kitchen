import { isRealDishPhotoUrl } from '../data/dishImages'

function catalogBaseUrl(): string {
  if (typeof TARO_APP_CATALOG_BASE_URL !== 'string') return ''
  return TARO_APP_CATALOG_BASE_URL.trim().replace(/\/+$/, '')
}

function isLocalCatalogBase(base: string): boolean {
  return /\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/i.test(base)
}

/** 小程序可安全渲染的封面图（避免 DevTools 对 HTTP / 本地代理反复 403） */
export function isRenderableRecipeImage(url?: string): boolean {
  if (!url) return false
  const u = url.trim()
  if (!u) return false
  if (/^http:\/\//i.test(u)) return false
  if (/\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\//i.test(u)) return false
  return /^https:\/\//i.test(u)
}

/** 本地开发：经 catalog 服务代理下厨房图，绕过微信 downloadFile 域名校验 */
export function recipeImageUrl(url?: string): string | undefined {
  if (!url || !isRealDishPhotoUrl(url)) return undefined
  const base = catalogBaseUrl()
  if (base && isLocalCatalogBase(base)) {
    // 本地 img-proxy 在 DevTools 常 403；直接占位，避免 wx-image 反复请求
    return undefined
  }
  if (!/^https:\/\//i.test(url)) return undefined
  return isRenderableRecipeImage(url) ? url : undefined
}
