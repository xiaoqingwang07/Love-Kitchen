import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import type { PantryStore } from '../../store/pantryStore'
import type { HouseholdStore } from '../../store/householdStore'
import { checkApiKey } from '../../api/recipe'
import { householdApiConfigured } from '../../api/household'
import { getDefaultDinersCount, setDefaultDinersCount } from '../../store/userPreferences'
import {
  consumeProfileOpenFavorites,
  consumeProfileOpenShopping,
  consumePendingJoinCode,
} from '../../utils/navigationPayload'
import {
  reminderConfigured,
  getReminderState,
  requestExpiryReminderConsent,
  disableExpiryReminder,
  syncExpiryReminders,
  type ConsentResult,
} from '../../utils/subscribeReminder'

/** 仅在开发/体验版环境显示工程调试入口 */
export function isDevEnv(): boolean {
  try {
    const info = Taro.getAccountInfoSync?.()
    const env = info?.miniProgram?.envVersion
    return env === 'develop' || env === 'trial'
  } catch {
    return false
  }
}

export function useProfileLifecycle(
  pantryStore: PantryStore,
  householdStore: HouseholdStore,
  onOpenFavorites: () => void,
  onOpenShopping?: () => void
) {
  const router = useRouter()
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null)
  const [dinersCount, setDinersCount] = useState(() => getDefaultDinersCount())
  const [devUnlocked, setDevUnlocked] = useState(isDevEnv())
  const [reminderOn, setReminderOn] = useState(() => getReminderState().optedIn)

  const handleToggleReminder = useCallback(async () => {
    if (!reminderConfigured()) {
      Taro.showToast({ title: '提醒功能即将上线', icon: 'none' })
      return
    }
    if (reminderOn) {
      disableExpiryReminder()
      setReminderOn(false)
      Taro.showToast({ title: '已关闭临期提醒', icon: 'none' })
      return
    }
    const result: ConsentResult = await requestExpiryReminderConsent()
    if (result === 'accepted') {
      setReminderOn(true)
      void syncExpiryReminders(pantryStore.items, { force: true })
      Taro.showToast({ title: '已开启，临期前会提醒你', icon: 'none' })
    } else if (result === 'banned') {
      Taro.showModal({
        title: '提醒被拒收',
        content: '请在微信「设置-订阅消息」中允许爱心厨房发送提醒',
        showCancel: false,
      })
    } else if (result === 'rejected') {
      Taro.showToast({ title: '已取消授权', icon: 'none' })
    } else {
      Taro.showToast({ title: '暂时无法开启', icon: 'none' })
    }
  }, [reminderOn, pantryStore.items])

  useDidShow(() => {
    void householdStore.syncOnShow()
    const joinFromQuery = router.params.joinCode
    const pendingJoin = joinFromQuery || consumePendingJoinCode()
    if (pendingJoin && householdApiConfigured()) {
      Taro.showModal({
        title: '加入家庭厨房',
        content: `检测到邀请码 ${pendingJoin}，是否加入？`,
        success: (r) => {
          if (r.confirm) void householdStore.joinHousehold(String(pendingJoin))
        },
      })
    }
    if (getReminderState().optedIn) {
      void syncExpiryReminders(pantryStore.items)
    }
    if (consumeProfileOpenFavorites()) {
      onOpenFavorites()
    }
    if (consumeProfileOpenShopping()) {
      onOpenShopping?.()
    }
  })

  const handleDinersChange = (delta: number) => {
    const next = Math.max(1, Math.min(10, dinersCount + delta))
    setDinersCount(next)
    setDefaultDinersCount(next)
  }

  const handleTestLlmProxy = async () => {
    Taro.showLoading({ title: '检测中…' })
    const result = await checkApiKey()
    Taro.hideLoading()
    setApiKeyValid(result.valid)
    if (result.valid) {
      Taro.showToast({ title: 'AI 服务可用', icon: 'success' })
    } else {
      const notConfigured = result.error?.includes('TARO_APP_LLM_PROXY_URL')
      Taro.showModal({
        title: notConfigured ? 'AI 服务未配置' : '检测失败',
        content: notConfigured
          ? '当前构建没有填入服务端 AI 转发地址。部署 api/llm-proxy.js 后，把完整地址写入 .env.local 并重新构建。'
          : result.error || '请检查服务端部署与微信 request 合法域名',
        showCancel: false,
      })
    }
  }

  useEffect(() => {
    setDinersCount(getDefaultDinersCount())
  }, [])

  return {
    apiKeyValid,
    dinersCount,
    devUnlocked,
    setDevUnlocked,
    reminderOn,
    handleToggleReminder,
    handleDinersChange,
    handleTestLlmProxy,
  }
}
