/**
 * 家庭厨房 API 抽象层：远端同步 + 本地降级
 */
import Taro from '@tarojs/taro'
import type { Household, HouseholdMember, HouseholdShoppingItem } from '../types/household'
import type { PantryItem } from '../types/pantry'

export function householdApiConfigured(): boolean {
  return typeof TARO_APP_HOUSEHOLD_API_URL === 'string' && TARO_APP_HOUSEHOLD_API_URL.trim().length > 0
}

function apiUrl(): string {
  return householdApiConfigured() ? TARO_APP_HOUSEHOLD_API_URL.trim().replace(/\/+$/, '') : ''
}

type ApiResponse = {
  ok?: boolean
  error?: string
  household?: Household
  memberToken?: string
}

/** 家庭同步 API 错误；401 表示 memberToken 无效，需重新加入家庭 */
export class HouseholdApiError extends Error {
  readonly statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'HouseholdApiError'
    this.statusCode = statusCode
  }

  get unauthorized(): boolean {
    return this.statusCode === 401
  }
}

function normalizeApiErrorMessage(raw: string | undefined, statusCode: number): string {
  const err = (raw || '').trim().toLowerCase()
  if (statusCode === 401 || err === 'unauthorized') {
    return '无权访问家庭数据，请重新加入家庭'
  }
  if (err === 'not found') return '家庭不存在或已被删除'
  if (raw?.trim()) return raw.trim()
  return `同步失败 (${statusCode})`
}

async function post(body: Record<string, unknown>): Promise<ApiResponse> {
  const url = apiUrl()
  if (!url) throw new HouseholdApiError('家庭同步未配置')
  let res: Taro.request.SuccessCallbackResult<ApiResponse>
  try {
    res = await Taro.request({
      url,
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: body,
      timeout: 15000,
    })
  } catch {
    throw new HouseholdApiError('网络异常，请稍后重试')
  }
  const data = res.data as ApiResponse
  if (res.statusCode === 401) {
    throw new HouseholdApiError(normalizeApiErrorMessage(data?.error, 401), 401)
  }
  if (res.statusCode >= 400 || !data?.ok) {
    throw new HouseholdApiError(normalizeApiErrorMessage(data?.error, res.statusCode), res.statusCode)
  }
  return data
}

function randomInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

function randomId(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** 无远端时本地创建（邀请码仅本机有效，需配置 API 才能跨设备） */
export function createHouseholdLocal(
  member: HouseholdMember,
  pantryItems: PantryItem[],
  shoppingList: HouseholdShoppingItem[] = []
): Household {
  return {
    householdId: randomId('local_'),
    inviteCode: randomInviteCode(),
    members: [member],
    pantryItems,
    shoppingList,
    updatedAt: Date.now(),
    updatedBy: member.nickname,
  }
}

export async function createHouseholdRemote(
  member: HouseholdMember,
  pantryItems: PantryItem[],
  shoppingList: HouseholdShoppingItem[] = []
): Promise<{ household: Household; memberToken: string }> {
  const data = await post({
    action: 'create',
    member,
    pantryItems,
    shoppingList,
  })
  if (!data.household || !data.memberToken) {
    throw new HouseholdApiError('创建家庭失败')
  }
  return { household: data.household, memberToken: data.memberToken }
}

export async function joinHouseholdRemote(
  inviteCode: string,
  member: HouseholdMember
): Promise<{ household: Household; memberToken: string }> {
  const data = await post({
    action: 'join',
    inviteCode: inviteCode.trim().toUpperCase(),
    member,
  })
  if (!data.household || !data.memberToken) {
    throw new HouseholdApiError('加入家庭失败')
  }
  return { household: data.household, memberToken: data.memberToken }
}

export async function pullHouseholdRemote(
  householdId: string,
  memberId: string,
  memberToken: string
): Promise<Household> {
  const data = await post({
    action: 'pull',
    householdId,
    memberId,
    memberToken,
  })
  if (!data.household) {
    throw new HouseholdApiError('拉取失败：服务端未返回家庭数据')
  }
  return data.household
}

export async function pushHouseholdRemote(
  household: Household,
  memberId: string,
  memberToken: string
): Promise<Household> {
  const data = await post({
    action: 'push',
    household,
    memberId,
    memberToken,
  })
  if (!data.household) throw new HouseholdApiError('推送失败：服务端未返回家庭数据')
  return data.household
}
