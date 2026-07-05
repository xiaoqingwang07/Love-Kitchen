/**
 * P2 MobX：bindPantry 先 reaction 再 applyRemotePantry
 * - bind 后 pushCount=0，suppress 已被 reaction 消费
 * - 首次用户编辑 suppress=false，schedulePush 触发
 * - 第二次用户编辑 suppress=false，debounce 合并为一次 pushRemote
 */
import { makeAutoObservable, reaction } from 'mobx'

const DEBOUNCE_MS = 50

class Pantry {
  items = []
  replaceItems(x) {
    this.items = x
  }
  constructor() {
    makeAutoObservable(this)
  }
}

function debounce(fn, ms) {
  let timer
  const debounced = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      fn()
    }, ms)
  }
  debounced.flush = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    fn()
  }
  return debounced
}

function bindPantryLikeStore(h, pantry) {
  h.pantry = pantry
  h.schedulePush = debounce(() => {
    h.pushCount++
  }, DEBOUNCE_MS)
  h.disposer = reaction(
    () =>
      pantry.items.map((i) => ({
        id: i.id,
        name: i.name,
        amount: i.amount,
        expiresAt: i.expiresAt,
      })),
    () => {
      if (h.suppressNextPantryPush) {
        h.suppressNextPantryPush = false
        return
      }
      if (h.mode === 'household' && h.household) h.schedulePush()
    }
  )
  if (h.mode === 'household' && h.household?.pantryItems?.length) {
    h.suppressNextPantryPush = true
    pantry.replaceItems(h.household.pantryItems)
  }
}

function awaitReaction() {
  return new Promise((r) => queueMicrotask(r))
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const pantry = new Pantry()
const store = {
  mode: 'household',
  household: { pantryItems: [{ id: '1', name: '鸡蛋', amount: '2', expiresAt: 1 }] },
  suppressNextPantryPush: false,
  pushCount: 0,
  pantry: null,
  disposer: null,
  schedulePush: null,
}

bindPantryLikeStore(store, pantry)
await awaitReaction()

if (store.pushCount !== 0) {
  console.error(`FAIL bind 后 pushCount 应为 0，实际 ${store.pushCount}`)
  process.exit(1)
}
if (store.suppressNextPantryPush !== false) {
  console.error(`FAIL bind 后 suppress 应已被 reaction 消费，实际 ${store.suppressNextPantryPush}`)
  process.exit(1)
}

pantry.replaceItems([{ id: '2', name: '番茄', amount: '3', expiresAt: 2 }])
await awaitReaction()
await sleep(DEBOUNCE_MS + 10)

if (store.suppressNextPantryPush !== false) {
  console.error('FAIL 首次用户编辑后 suppress 应为 false')
  process.exit(1)
}
if (store.pushCount !== 1) {
  console.error(`FAIL 首次用户编辑后 pushCount 应为 1，实际 ${store.pushCount}`)
  process.exit(1)
}

pantry.replaceItems([{ id: '3', name: '土豆', amount: '2', expiresAt: 3 }])
await awaitReaction()

if (store.suppressNextPantryPush !== false) {
  console.error('FAIL 第二次用户编辑后 suppress 应为 false')
  process.exit(1)
}

await sleep(DEBOUNCE_MS + 10)

if (store.pushCount !== 2) {
  console.error(`FAIL debounce 结束后 pushCount 应为 2，实际 ${store.pushCount}`)
  process.exit(1)
}

// 连续两次编辑在 debounce 窗口内应合并为一次 push
const pantry2 = new Pantry()
const store2 = {
  mode: 'household',
  household: { pantryItems: [{ id: '1', name: '鸡蛋', amount: '2', expiresAt: 1 }] },
  suppressNextPantryPush: false,
  pushCount: 0,
  pantry: null,
  disposer: null,
  schedulePush: null,
}
bindPantryLikeStore(store2, pantry2)
await awaitReaction()

pantry2.replaceItems([{ id: '2', name: '番茄', amount: '3', expiresAt: 2 }])
await awaitReaction()
pantry2.replaceItems([{ id: '3', name: '土豆', amount: '2', expiresAt: 3 }])
await awaitReaction()

if (store2.suppressNextPantryPush !== false) {
  console.error('FAIL 连续编辑后 suppress 应为 false')
  process.exit(1)
}

await sleep(DEBOUNCE_MS + 10)

if (store2.pushCount !== 1) {
  console.error(`FAIL 连续两次用户编辑 debounce 后 pushCount 应为 1，实际 ${store2.pushCount}`)
  process.exit(1)
}

console.log(
  'household-suppress-push-check passed: bind=0 firstEdit=1 secondEdit=2 batchedEdits=1'
)
