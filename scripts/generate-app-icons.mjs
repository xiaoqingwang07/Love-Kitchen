#!/usr/bin/env node
/**
 * 生成 AppIcon 用 48px PNG（圆角底 + 中文 glyph）
 * 运行：node scripts/generate-app-icons.mjs
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const outDir = path.join(root, 'src/assets/icons')
fs.mkdirSync(outDir, { recursive: true })

const icons = {
  camera: { glyph: '拍', bg: '#4A8C6C', fg: '#FFFFFF' },
  meal: { glyph: '餐', bg: '#4A8C6C', fg: '#FFFFFF' },
  search: { glyph: '搜', bg: '#E8EDE9', fg: '#4A8C6C' },
  mic: { glyph: '说', bg: '#E8EDE9', fg: '#4A8C6C' },
  cart: { glyph: '购', bg: '#4A8C6C', fg: '#FFFFFF' },
  fridge: { glyph: '藏', bg: '#E8EDE9', fg: '#4A8C6C' },
  share: { glyph: '享', bg: '#E8EDE9', fg: '#4A8C6C' },
  add: { glyph: '+', bg: '#2C2A26', fg: '#FFFFFF' },
  cook: { glyph: '做', bg: '#4A8C6C', fg: '#FFFFFF' },
  list: { glyph: '单', bg: '#E8EDE9', fg: '#4A8C6C' },
  home: { glyph: '家', bg: '#E8EDE9', fg: '#4A8C6C' },
  heart: { glyph: '♥', bg: '#F5E6DC', fg: '#C45A3A' },
}

const py = `
import json, sys
from PIL import Image, ImageDraw, ImageFont

data = json.loads(sys.argv[1])
out_dir = sys.argv[2]
size = 48
radius = 10

for name, spec in data.items():
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    bg = spec['bg']
    r, g, b = int(bg[1:3], 16), int(bg[3:5], 16), int(bg[5:7], 16)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=(r, g, b, 255))
    fg = spec['fg']
    fr, fg_g, fb = int(fg[1:3], 16), int(fg[3:5], 16), int(fg[5:7], 16)
    glyph = spec['glyph']
    font_size = 22 if len(glyph) == 1 and ord(glyph[0]) < 128 else 18
    try:
        font = ImageFont.truetype('/System/Library/Fonts/PingFang.ttc', font_size)
    except Exception:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), glyph, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size - tw) / 2 - bbox[0], (size - th) / 2 - bbox[1]), glyph, fill=(fr, fg_g, fb, 255), font=font)
    img.save(f"{out_dir}/{name}.png")
print(len(data))
`

execFileSync('python3', ['-c', py, JSON.stringify(icons), outDir], { stdio: 'inherit' })
console.log(`Generated ${Object.keys(icons).length} icons in src/assets/icons/`)
