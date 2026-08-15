#!/usr/bin/env node
const Module = require('module')
const path = require('path')

const taro = {
  getStorageSync: () => '',
  setStorageSync: () => {},
  addPhoneCalendar: async () => ({}),
  setClipboardData: async () => ({}),
  ENV_TYPE: { WEB: 'WEB', WEAPP: 'WEAPP' },
  getEnv: () => 'WEAPP',
}

const origLoad = Module._load
Module._load = function hook(request, parent, isMain) {
  if (request === '@tarojs/taro') return Object.assign(taro, { default: taro })
  return origLoad.apply(this, arguments)
}

require('@swc/register')({
  module: { type: 'commonjs' },
  jsc: {
    parser: { syntax: 'typescript', tsx: true, decorators: true },
    target: 'es2022',
  },
})

const {
  buildShoppingIcs,
  parseYmd,
  todayYmd,
  formatRemindLabel,
  isWebRuntime,
  openWebDatePicker,
} = require(path.join(__dirname, '../src/utils/shoppingRemind.ts'))

function fail(msg) {
  console.error(`FAIL ${msg}`)
  process.exit(1)
}

const ics = buildShoppingIcs('2026-08-20', ['虾', '黄瓜', '紫菜'])
if (!ics.includes('BEGIN:VCALENDAR')) fail('ICS 应含日历头')
if (!ics.includes('DTSTART;VALUE=DATE:20260820')) fail('ICS 日期应为 20260820')
if (!ics.includes('SUMMARY:超市采购 · 3 样')) fail(`ICS 标题不对: ${ics}`)
if (!ics.includes('VALARM')) fail('ICS 应含闹钟')
if (!parseYmd('2026-08-20')) fail('应能解析 YYYY-MM-DD')
if (parseYmd('bad')) fail('非法日期应返回 null')
if (!/^\d{4}-\d{2}-\d{2}$/.test(todayYmd())) fail('todayYmd 格式')
if (formatRemindLabel('2026-08-20') !== '8 月 20 日') fail(`提醒文案: ${formatRemindLabel('2026-08-20')}`)
if (typeof isWebRuntime !== 'function') fail('isWebRuntime 应导出')
if (typeof openWebDatePicker !== 'function') fail('openWebDatePicker 应导出')
if (openWebDatePicker({ value: '2026-08-20', onPick: () => {} }) !== false) {
  fail('无 document 时 openWebDatePicker 应返回 false')
}

console.log('shopping-remind-check passed')
