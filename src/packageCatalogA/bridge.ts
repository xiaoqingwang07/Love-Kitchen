/**
 * catalog A 分包：索引 + chunk 0–4
 */
import Taro from '@tarojs/taro'
import { loadPkgIndex, loadPkgChunk } from './subpkgLoader'
import type { CatalogBridgeParts } from '../data/catalogBridge'

function register() {
  const bridge = { loadPkgIndex, loadPkgChunk }
  const g = globalThis as CatalogBridgeParts & { __catalogPartA?: typeof bridge }
  g.__catalogPartA = bridge
  try {
    const app = Taro.getApp<CatalogBridgeParts>()
    if (app) app.catalogPartA = bridge
  } catch {
    /* getApp 未就绪时走 globalThis */
  }
  Taro.eventCenter.trigger('catalogPartReady', 'a')
}

register()
