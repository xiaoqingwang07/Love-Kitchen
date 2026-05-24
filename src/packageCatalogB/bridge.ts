/**
 * catalog B 分包：chunk 5–9
 */
import Taro from '@tarojs/taro'
import { loadPkgChunk } from './subpkgLoader'
import type { CatalogBridgeParts } from '../data/catalogBridge'

function register() {
  const bridge = { loadPkgChunk }
  const g = globalThis as CatalogBridgeParts & { __catalogPartB?: typeof bridge }
  g.__catalogPartB = bridge
  try {
    const app = Taro.getApp<CatalogBridgeParts>()
    if (app) app.catalogPartB = bridge
  } catch {
    /* getApp 未就绪时走 globalThis */
  }
  Taro.eventCenter.trigger('catalogPartReady', 'b')
}

register()
