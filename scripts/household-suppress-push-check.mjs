/**
 * P2 MobX：bindPantry 先 reaction 再 applyRemotePantry；
 * bind 后 pushCount=0；首次用户编辑 suppress=false 且 pushCount=1
 */
import { makeAutoObservable, reaction } from 'mobx'

class Pantry {
  items = []
  replaceItems(x) {
    this.items = x
  }
  constructor() {
    makeAutoObservable(this)
  }
}

function bindPantryLikeStore(h, pantry) {
  h.pantry = pantry
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
      if (h.mode === 'household' && h.household) h.pushCount++
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

const pantry = new Pantry()
const store = {
  mode: 'household',
  household: { pantryItems: [{ id: '1', name: '鸡蛋', amount: '2', expiresAt: 1 }] },
  suppressNextPantryPush: false,
  pushCount: 0,
  pantry: null,
  disposer: null,
}

bindPantryLikeStore(store, pantry)
await awaitReaction()

if (store.pushCount !== 0) {
  console.error(`FAIL bind 后 pushCount 应为 0，实际 ${store.pushCount}`)
  process.exit(1)
}
if (store.suppressNextPantryPush !== false) {
  console.error(`FAIL bind 后 reaction 应已消费 suppress，实际 ${store.suppressNextPantryPush}`)
  process.exit(1)
}

pantry.replaceItems([{ id: '2', name: '番茄', amount: '3', expiresAt: 2 }])
await awaitReaction()

if (store.suppressNextPantryPush !== false) {
  console.error(`FAIL 首次用户编辑后 suppress 应为 false`)
  process.exit(1)
}
if (store.pushCount !== 1) {
  console.error(`FAIL 首次用户编辑后 pushCount 应为 1，实际 ${store.pushCount}`)
  process.exit(1)
}

console.log('household-suppress-push-check passed: bind push=0 firstEdit push=1')
