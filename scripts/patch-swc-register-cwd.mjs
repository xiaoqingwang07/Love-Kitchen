/**
 * Node 22+：@swc/register 会把 cwd 传入 transformSync，而 Taro 3.6 锁定的
 * @swc/core@1.3.x 的 WASM 不接受根级 cwd，导致「unknown field cwd」并连带
 * Taro 预设加载失败。在调用 transformSync 前删除 cwd 即可，对行为无影响。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const target = path.join(root, 'node_modules', '@swc', 'register', 'lib', 'node.js')

if (!fs.existsSync(target)) {
  console.warn('[patch-swc-register-cwd] skip: @swc/register not installed yet')
  process.exit(0)
}

let s = fs.readFileSync(target, 'utf8')
const marker = '/* lk-patch: delete cwd for Node22+ swc */'
if (s.includes(marker)) {
  process.exit(0)
}

const needle =
  '    var output = swc.transformSync(code, __assign(__assign({}, opts), { sourceMaps: opts.sourceMaps === undefined ? true : opts.sourceMaps }));'
const idx = s.indexOf(needle)
if (idx === -1) {
  console.warn('[patch-swc-register-cwd] skip: unexpected @swc/register layout')
  process.exit(0)
}

const replacement = `    ${marker}
    delete opts.cwd;
${needle}`

s = s.slice(0, idx) + replacement + s.slice(idx + needle.length)
fs.writeFileSync(target, s, 'utf8')
console.log('[patch-swc-register-cwd] applied to @swc/register')
