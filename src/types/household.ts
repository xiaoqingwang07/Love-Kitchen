import type { PantryItem } from './pantry'

export interface HouseholdMember {
  id: string
  nickname: string
  joinedAt: number
  /** 仅服务端存储 token hash，不下发客户端 */
  tokenHash?: string
}

export interface HouseholdShoppingItem {
  id: string
  name: string
  amount: string
  checked: boolean
  addedBy?: string
  addedAt: number
}

export interface Household {
  householdId: string
  inviteCode: string
  members: HouseholdMember[]
  pantryItems: PantryItem[]
  shoppingList: HouseholdShoppingItem[]
  updatedAt: number
  updatedBy?: string
}

export type HouseholdSyncMode = 'local' | 'household'
