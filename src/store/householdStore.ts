import { makeAutoObservable, reaction } from 'mobx'
import Taro from '@tarojs/taro'
import type { Household, HouseholdMember, HouseholdShoppingItem, HouseholdSyncMode } from '../types/household'
import type { PantryStore } from './pantryStore'
import { STORAGE_KEYS } from './storageKeys'
import {
  createHouseholdRemote,
  joinHouseholdRemote,
  pullHouseholdRemote,
  pushHouseholdRemote,
  householdApiConfigured,
  HouseholdApiError,
} from '../api/household'

const PUSH_DEBOUNCE_MS = 800

function debounce(fn: () => void, ms: number): (() => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined
  const debounced = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      fn()
    }, ms)
  }
  debounced.cancel = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }
  return debounced
}

function generateMemberId(): string {
  try {
    const cached = Taro.getStorageSync(STORAGE_KEYS.householdMemberId)
    if (typeof cached === 'string' && cached.trim()) return cached.trim()
  } catch {
    /* ignore */
  }
  const id = 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  try {
    Taro.setStorageSync(STORAGE_KEYS.householdMemberId, id)
  } catch {
    /* ignore */
  }
  return id
}

function loadMemberToken(): string {
  try {
    const cached = Taro.getStorageSync(STORAGE_KEYS.householdMemberToken)
    return typeof cached === 'string' ? cached.trim() : ''
  } catch {
    return ''
  }
}

function saveMemberToken(token: string) {
  try {
    if (token) Taro.setStorageSync(STORAGE_KEYS.householdMemberToken, token)
    else Taro.removeStorageSync(STORAGE_KEYS.householdMemberToken)
  } catch {
    /* ignore */
  }
}

function generateShoppingId(): string {
  return 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function syncErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) {
    const msg = e.message.trim()
    if (msg) return msg
  }
  return fallback
}

function clearUnauthorizedToken(store: { memberToken: string }) {
  store.memberToken = ''
  saveMemberToken('')
}

interface PersistedHouseholdState {
  mode: HouseholdSyncMode
  household: Household | null
  memberNickname: string
  shoppingList: HouseholdShoppingItem[]
}

export class HouseholdStore {
  mode: HouseholdSyncMode = 'local'
  household: Household | null = null
  memberId: string = generateMemberId()
  memberToken: string = loadMemberToken()
  memberNickname: string = '我'
  shoppingList: HouseholdShoppingItem[] = []
  syncStatus: 'idle' | 'syncing' | 'error' = 'idle'
  lastSyncAt = 0
  lastSyncError = ''

  private pantry: PantryStore | null = null
  private schedulePush = debounce(() => void this.pushRemote(), PUSH_DEBOUNCE_MS)
  private disposer: (() => void) | null = null
  /** pull 应用远端冰箱时抑制自动 push；由 reaction 消费复位（不用 counter/setTimeout/snapshot） */
  private suppressNextPantryPush = false

  constructor() {
    makeAutoObservable(this)
    this.loadLocal()
  }

  bindPantry(pantry: PantryStore) {
    this.pantry = pantry
    this.disposer?.()
    // reaction 必须先于 applyRemotePantry，否则 suppress 无人消费会误拦首次用户编辑
    this.disposer = reaction(
      () =>
        pantry.items.map((i) => ({
          id: i.id,
          name: i.name,
          amount: i.amount,
          expiresAt: i.expiresAt,
        })),
      () => {
        if (this.suppressNextPantryPush) {
          this.suppressNextPantryPush = false
          return
        }
        if (this.mode === 'household' && this.household) {
          this.schedulePush()
        }
      }
    )
    if (this.mode === 'household' && this.household?.pantryItems?.length) {
      this.applyRemotePantry(this.household.pantryItems)
    }
  }

  get inHousehold(): boolean {
    return this.mode === 'household' && this.household !== null
  }

  get inviteCode(): string {
    return this.household?.inviteCode ?? ''
  }

  get lastUpdatedLabel(): string {
    if (!this.household?.updatedAt) return ''
    const who = this.household.updatedBy || '家人'
    const mins = Math.max(0, Math.floor((Date.now() - this.household.updatedAt) / 60000))
    if (mins < 1) return `${who} · 刚刚更新`
    if (mins < 60) return `${who} · ${mins} 分钟前`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${who} · ${hours} 小时前`
    return `${who} · ${Math.floor(hours / 24)} 天前`
  }

  private loadLocal() {
    try {
      const raw = Taro.getStorageSync(STORAGE_KEYS.householdState) as PersistedHouseholdState | ''
      if (!raw || typeof raw !== 'object') return
      this.mode = raw.mode === 'household' ? 'household' : 'local'
      this.household = raw.household ?? null
      this.memberNickname = raw.memberNickname || '我'
      this.shoppingList = Array.isArray(raw.shoppingList) ? raw.shoppingList : []
      if (this.household?.shoppingList?.length) {
        this.shoppingList = this.household.shoppingList
      }
    } catch {
      /* ignore */
    }
  }

  private persistLocal() {
    const state: PersistedHouseholdState = {
      mode: this.mode,
      household: this.household,
      memberNickname: this.memberNickname,
      shoppingList: this.shoppingList,
    }
    try {
      Taro.setStorageSync(STORAGE_KEYS.householdState, state)
    } catch (e) {
      console.error('HouseholdStore persist failed', e)
    }
  }

  private currentMember(): HouseholdMember {
    return { id: this.memberId, nickname: this.memberNickname, joinedAt: Date.now() }
  }

  private applyRemotePantry(items: Household['pantryItems']) {
    if (!this.pantry || !Array.isArray(items)) return
    // MobX reaction 在 pantry action 结束后才触发；flag 由 reaction 回调消费复位。
    this.suppressNextPantryPush = true
    this.pantry.replaceItems(items)
  }

  private applyHousehold(h: Household, applyPantry: boolean) {
    this.household = h
    this.shoppingList = h.shoppingList || []
    if (applyPantry) {
      this.applyRemotePantry(h.pantryItems)
    }
    this.persistLocal()
  }

  private failSync(e: unknown, fallback: string) {
    this.syncStatus = 'error'
    if (e instanceof HouseholdApiError && e.unauthorized) {
      clearUnauthorizedToken(this)
    }
    this.lastSyncError = syncErrorMessage(e, fallback)
  }

  setMemberNickname(name: string) {
    const n = name.trim()
    if (!n) return
    this.memberNickname = n.slice(0, 12)
    this.persistLocal()
  }

  async createHousehold(): Promise<boolean> {
    if (!householdApiConfigured()) {
      Taro.showToast({ title: '家庭云同步即将推出', icon: 'none' })
      return false
    }
    const member = this.currentMember()
    const pantryItems = this.pantry?.items ?? []
    try {
      const { household, memberToken } = await createHouseholdRemote(
        member,
        pantryItems,
        this.shoppingList
      )
      this.memberToken = memberToken
      saveMemberToken(memberToken)
      this.mode = 'household'
      this.applyHousehold(household, false)
      await this.pushRemote()
      Taro.showToast({ title: '家庭厨房已创建', icon: 'success' })
      return true
    } catch (e) {
      Taro.showToast({ title: syncErrorMessage(e, '创建失败'), icon: 'none' })
      return false
    }
  }

  async joinHousehold(inviteCode: string): Promise<boolean> {
    const code = inviteCode.trim().toUpperCase()
    if (code.length < 4) {
      Taro.showToast({ title: '请输入邀请码', icon: 'none' })
      return false
    }
    if (!householdApiConfigured()) {
      Taro.showModal({
        title: '家庭云同步即将推出',
        content: '上线后可与家人共享冰箱和采购清单。目前可先使用采购清单分享功能。',
        showCancel: false,
      })
      return false
    }
    try {
      const { household, memberToken } = await joinHouseholdRemote(code, this.currentMember())
      this.memberToken = memberToken
      saveMemberToken(memberToken)
      this.mode = 'household'
      this.applyHousehold(household, true)
      Taro.showToast({ title: '已加入家庭厨房', icon: 'success' })
      return true
    } catch (e) {
      Taro.showToast({ title: syncErrorMessage(e, '加入失败'), icon: 'none' })
      return false
    }
  }

  leaveHousehold() {
    this.mode = 'local'
    this.household = null
    this.memberToken = ''
    saveMemberToken('')
    this.syncStatus = 'idle'
    this.lastSyncError = ''
    this.persistLocal()
    Taro.showToast({ title: '已退出家庭模式', icon: 'none' })
  }

  async pullRemote(): Promise<void> {
    if (!this.inHousehold || !this.household) return
    if (!householdApiConfigured()) return
    if (!this.memberToken) {
      this.syncStatus = 'error'
      this.lastSyncError = '缺少成员凭证，请重新加入家庭'
      return
    }
    this.syncStatus = 'syncing'
    this.schedulePush.cancel()
    const prevUpdatedAt = this.household.updatedAt
    const prevUpdatedBy = this.household.updatedBy
    try {
      const remote = await pullHouseholdRemote(
        this.household.householdId,
        this.memberId,
        this.memberToken
      )
      this.applyHousehold(remote, true)
      this.lastSyncAt = Date.now()
      this.lastSyncError = ''
      this.syncStatus = 'idle'
      if (
        remote.updatedBy &&
        remote.updatedBy !== this.memberNickname &&
        remote.updatedAt > prevUpdatedAt
      ) {
        Taro.showToast({
          title: `${remote.updatedBy} 更新了家庭清单`,
          icon: 'none',
          duration: 2500,
        })
      } else if (
        remote.updatedAt > prevUpdatedAt &&
        remote.updatedBy &&
        remote.updatedBy !== prevUpdatedBy &&
        remote.updatedBy !== this.memberNickname
      ) {
        Taro.showToast({ title: '家庭数据已同步', icon: 'none' })
      }
    } catch (e) {
      this.failSync(e, '拉取失败')
    }
  }

  async pushRemote(): Promise<void> {
    if (!this.inHousehold || !this.household || !this.pantry) return
    if (!householdApiConfigured()) {
      this.household = {
        ...this.household,
        pantryItems: this.pantry.items,
        shoppingList: this.shoppingList,
        updatedAt: Date.now(),
        updatedBy: this.memberNickname,
      }
      this.persistLocal()
      return
    }
    if (!this.memberToken) {
      this.syncStatus = 'error'
      this.lastSyncError = '缺少成员凭证，请重新加入家庭'
      return
    }
    this.syncStatus = 'syncing'
    try {
      const payload: Household = {
        ...this.household,
        pantryItems: this.pantry.items,
        shoppingList: this.shoppingList,
        updatedAt: Date.now(),
        updatedBy: this.memberNickname,
      }
      const merged = await pushHouseholdRemote(payload, this.memberId, this.memberToken)
      this.household = merged
      this.shoppingList = merged.shoppingList || this.shoppingList
      this.lastSyncAt = Date.now()
      this.lastSyncError = ''
      this.syncStatus = 'idle'
      this.persistLocal()
    } catch (e) {
      this.failSync(e, '推送失败')
    }
  }

  async syncOnShow() {
    if (!this.inHousehold) return
    await this.pullRemote()
  }

  addShoppingItems(items: { name: string; amount: string }[]) {
    if (items.length === 0) return
    const existing = new Set(this.shoppingList.map((i) => i.name.trim()))
    for (const item of items) {
      const name = item.name.trim()
      if (!name || existing.has(name)) continue
      existing.add(name)
      this.shoppingList.push({
        id: generateShoppingId(),
        name,
        amount: item.amount || '适量',
        checked: false,
        addedBy: this.memberNickname,
        addedAt: Date.now(),
      })
    }
    if (this.household) {
      this.household = { ...this.household, shoppingList: this.shoppingList }
    }
    this.persistLocal()
    if (this.inHousehold) this.schedulePush()
  }

  toggleShoppingItem(id: string) {
    const idx = this.shoppingList.findIndex((i) => i.id === id)
    if (idx < 0) return
    this.shoppingList[idx] = {
      ...this.shoppingList[idx],
      checked: !this.shoppingList[idx].checked,
    }
    this.persistLocal()
    if (this.inHousehold) this.schedulePush()
  }

  removeCheckedShopping() {
    const removed = this.shoppingList.some((i) => i.checked)
    if (!removed) {
      Taro.showToast({ title: '请先勾选要删除的项', icon: 'none' })
      return
    }
    this.shoppingList = this.shoppingList.filter((i) => !i.checked)
    if (this.household) {
      this.household = { ...this.household, shoppingList: this.shoppingList }
    }
    this.persistLocal()
    if (this.inHousehold) this.schedulePush()
  }
}

export const householdStore = new HouseholdStore()
