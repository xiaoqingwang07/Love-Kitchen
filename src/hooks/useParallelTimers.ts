import { useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'

/**
 * 多步骤并行计时器：基于时间戳，后台挂起恢复后依然准确。
 *
 * 每个计时条目：
 *  - running=true 时，持有 expireAt 未来时间戳，剩余秒数由 now 推导；
 *  - running=false 且 remaining!=null 时，为已暂停，保留剩余秒数；
 *  - remaining=0 触发 onFire 回调（仅一次），同时停止。
 */
export type TimerEntry = {
  /** 秒数 */
  remaining: number
  running: boolean
  /** 原始时长（秒） */
  totalSeconds: number
}

type InternalEntry = {
  expireAt: number | null
  pausedRemaining: number | null
  running: boolean
  totalSeconds: number
  fired: boolean
}

export function useParallelTimers() {
  const entriesRef = useRef<Record<string, InternalEntry>>({})
  const [, setTick] = useState(0)
  const forceRender = () => setTick((t) => (t + 1) % 1e9)

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      let anyFired = false
      for (const key in entriesRef.current) {
        const e = entriesRef.current[key]
        if (e.running && e.expireAt && !e.fired && now >= e.expireAt) {
          e.running = false
          e.fired = true
          e.expireAt = null
          e.pausedRemaining = 0
          anyFired = true
          try {
            Taro.vibrateLong()
          } catch {
            /* ignore */
          }
          Taro.showToast({ title: '时间到', icon: 'none' })
        }
      }
      if (anyFired || Object.values(entriesRef.current).some((e) => e.running)) {
        forceRender()
      }
    }, 500)
    return () => clearInterval(id)
  }, [])

  const snapshot = (key: string): TimerEntry | null => {
    const e = entriesRef.current[key]
    if (!e) return null
    if (e.running && e.expireAt) {
      const rem = Math.max(0, Math.ceil((e.expireAt - Date.now()) / 1000))
      return { remaining: rem, running: true, totalSeconds: e.totalSeconds }
    }
    return {
      remaining: e.pausedRemaining ?? 0,
      running: false,
      totalSeconds: e.totalSeconds,
    }
  }

  const start = (key: string, totalSeconds: number) => {
    if (totalSeconds <= 0) return
    const existing = entriesRef.current[key]
    const remaining =
      existing?.pausedRemaining != null && existing.pausedRemaining > 0
        ? existing.pausedRemaining
        : totalSeconds
    entriesRef.current[key] = {
      expireAt: Date.now() + remaining * 1000,
      pausedRemaining: null,
      running: true,
      totalSeconds,
      fired: false,
    }
    forceRender()
  }

  const pause = (key: string) => {
    const e = entriesRef.current[key]
    if (!e || !e.running || !e.expireAt) return
    const remaining = Math.max(0, Math.ceil((e.expireAt - Date.now()) / 1000))
    entriesRef.current[key] = {
      ...e,
      expireAt: null,
      running: false,
      pausedRemaining: remaining,
    }
    forceRender()
  }

  const reset = (key: string) => {
    delete entriesRef.current[key]
    forceRender()
  }

  const activeEntries = (): { key: string; entry: TimerEntry }[] => {
    const out: { key: string; entry: TimerEntry }[] = []
    for (const key in entriesRef.current) {
      const snap = snapshot(key)
      if (snap && (snap.running || (snap.remaining > 0 && entriesRef.current[key].pausedRemaining != null))) {
        out.push({ key, entry: snap })
      }
    }
    return out
  }

  return { snapshot, start, pause, reset, activeEntries }
}

export function formatMMSS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}
