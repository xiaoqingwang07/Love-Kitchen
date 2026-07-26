#!/usr/bin/env node
/**
 * 图标管线：SVG 源 → qlmanage 栅格化 → PIL 裁切归一/上色 → PNG
 *
 * 为什么不用字体：旧脚本 generate-app-icons.mjs 用 PIL 的字体接口加载
 * /System/Library/Fonts/PingFang.ttc 渲染汉字 glyph，但 PIL 无法打开 .ttc
 * 字体集合（实测 OSError: cannot open resource），旧脚本又用 except 静默兜底
 * 到 6px 位图字体，于是产出「色块 + 米粒大字符」的坏图标。
 * 新管线不依赖任何字体，仅用 macOS 自带 qlmanage 栅格化 SVG。
 *
 * 运行：node scripts/generate-icons.mjs
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const srcDir = path.join(root, 'scripts/icons/src')

// 对比度（对底色 #FDFCFB）：图标 2.49:1、tab 未选中 2.92:1、tab 选中 3.13:1。
// 原 #C6BFB8/#E89562 仅 1.78/2.30，小尺寸细线条下看不清，须与 app.config.ts 保持一致。
const ICON_GREY = '#A9A199'
const TAB_IDLE = '#9C948B'
const TAB_ACTIVE = '#D4783F'

const appIcon = (name) => [{ out: `src/assets/icons/${name}.png`, color: ICON_GREY, size: 144 }]
const tabIcon = (name) => [
  { out: `src/assets/tabbar/${name}.png`, color: TAB_IDLE, size: 162 },
  { out: `src/assets/tabbar/${name}_active.png`, color: TAB_ACTIVE, size: 162 },
]

/** SVG 名 -> 输出列表 { out: 路径, color: 描边色, size: 边长(px) } */
export const TARGETS = {
  // AppIcon（12 个，键名须与 src/components/AppIcon.tsx 的 AppIconName 一致）
  search: appIcon('search'),
  camera: appIcon('camera'),
  meal: appIcon('meal'),
  mic: appIcon('mic'),
  cart: appIcon('cart'),
  fridge: appIcon('fridge'),
  share: appIcon('share'),
  add: appIcon('add'),
  cook: appIcon('cook'),
  list: appIcon('list'),
  home: appIcon('home'),
  heart: appIcon('heart'),
  // tabBar（4 组 × 常态/选中，输出名须与 app.config.ts 的 iconPath 一致）
  'tab-home': tabIcon('home'),
  'tab-pick': tabIcon('pick'),
  'tab-pantry': tabIcon('pantry'),
  'tab-profile': tabIcon('profile'),
}

const py = `
import json, sys, os
from PIL import Image, ImageOps

specs = json.loads(sys.argv[1])
for s in specs:
    img = Image.open(s['raw'])
    # qlmanage 输出的是不透明白底（alpha 恒为 255），不能拿 alpha 当蒙版，
    # 否则整块画布都会被判为实心。改按明暗取蒙版：黑色描边 -> 不透明，白底 -> 透明。
    mask = ImageOps.invert(img.convert('L'))
    bbox = mask.getbbox()
    if bbox:
        mask = mask.crop(bbox)
    # 等比缩放进 size*0.82 的内容区，再居中贴到透明方形画布
    size = s['size']
    inner = int(size * 0.82)
    w, h = mask.size
    scale = min(inner / w, inner / h)
    mask = mask.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    canvas_mask = Image.new('L', (size, size), 0)
    canvas_mask.paste(mask, ((size - mask.size[0]) // 2, (size - mask.size[1]) // 2))
    # 用蒙版上色，描边色完全可控
    c = s['color'].lstrip('#')
    rgb = (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16))
    out = Image.new('RGBA', (size, size), rgb + (0,))
    out.putalpha(canvas_mask)
    os.makedirs(os.path.dirname(s['out']), exist_ok=True)
    out.save(s['out'])
print(len(specs))
`

export function build(targets = TARGETS) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lk-icons-'))
  const specs = []
  for (const [name, outs] of Object.entries(targets)) {
    const svg = path.join(srcDir, `${name}.svg`)
    if (!fs.existsSync(svg)) throw new Error(`缺少 SVG 源文件：${svg}`)
    execFileSync('qlmanage', ['-t', '-s', '512', '-o', tmp, svg], { stdio: 'ignore' })
    const raw = path.join(tmp, `${name}.svg.png`)
    if (!fs.existsSync(raw)) throw new Error(`qlmanage 未产出：${raw}`)
    for (const o of outs) {
      specs.push({ raw, out: path.join(root, o.out), color: o.color, size: o.size })
    }
  }
  execFileSync('python3', ['-c', py, JSON.stringify(specs)], { stdio: 'inherit' })
  fs.rmSync(tmp, { recursive: true, force: true })
  console.log(`Generated ${specs.length} icons`)
}

build()
