import Taro from '@tarojs/taro'
import { useState, useRef } from 'react'
import type { PantryStore } from '../../store/pantryStore'
import type { FridgeLayoutConfig } from '../../types/fridge'
import { parseShoppingLines } from '../../utils/fridgePlacement'
import { buildIntakePreview, previewToReceiptText, type IntakePreviewRow } from '../../utils/pantryIntake'
import { recognizePantryImage, PantryVisionError } from '../../api/pantryVision'
import { usesLlmProxy } from '../../api/recipe'
import { trackEvent } from '../../utils/analytics'
import { consumePantryPendingAction } from '../../utils/navigationPayload'
import {
  readIntakeDraft,
  clearIntakeDraft,
  pickImageForIntake,
  type IntakeDraft,
  type IntakeScene,
} from '../../utils/mediaIntake'
import { STORAGE_KEYS } from '../../store/storageKeys'

export function usePantryIntake(store: PantryStore, layout: FridgeLayoutConfig) {
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptText, setReceiptText] = useState('')
  const [receiptPreview, setReceiptPreview] = useState<IntakePreviewRow[] | null>(null)
  const [intakeDraft, setIntakeDraft] = useState<IntakeDraft | null>(null)
  const [intakeScene, setIntakeScene] = useState<IntakeScene>('receipt')
  const [visionLoading, setVisionLoading] = useState(false)
  const recognizedDraftAtRef = useRef(0)

  const runVisionRecognition = async (draft: IntakeDraft, mode: IntakeScene | 'auto' = 'auto') => {
    if (draft.kind !== 'photo' && draft.kind !== 'album') return
    if (!usesLlmProxy()) {
      Taro.showToast({ title: '可手动粘贴或核对清单', icon: 'none' })
      setShowReceipt(true)
      return
    }
    setVisionLoading(true)
    setShowReceipt(true)
    try {
      const visionMode = mode === 'auto' ? 'auto' : mode
      const result = await recognizePantryImage(draft.filePath, visionMode)
      setIntakeScene(result.kind)
      setReceiptText(previewToReceiptText(result.items))
      setReceiptPreview(buildIntakePreview(result.items, store.items, layout))
      Taro.showToast({
        title: result.kind === 'receipt' ? '小票识别完成' : '食材识别完成',
        icon: 'success',
      })
    } catch (e) {
      const msg = e instanceof PantryVisionError ? e.message : '识别失败，请手动核对清单'
      Taro.showToast({ title: msg, icon: 'none', duration: 2800 })
    } finally {
      setVisionLoading(false)
    }
  }

  const openImageIntake = (scene: IntakeScene) => {
    Taro.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success: async (res) => {
        const source = res.tapIndex === 0 ? 'camera' : 'album'
        const draft = await pickImageForIntake(source, scene)
        if (!draft) return
        setIntakeDraft(draft)
        setIntakeScene(scene)
        setReceiptPreview(null)
        setReceiptText('')
        setShowReceipt(true)
        void runVisionRecognition(draft, scene)
      },
    })
  }

  const openPasteIntake = () => {
    setReceiptPreview(null)
    setReceiptText('')
    setIntakeDraft(null)
    setShowReceipt(true)
  }

  const handleParseReceipt = () => {
    const lines = parseShoppingLines(receiptText)
    if (lines.length === 0) {
      Taro.showToast({ title: '请先输入清单', icon: 'none' })
      return
    }
    setReceiptPreview(buildIntakePreview(lines, store.items, layout))
  }

  const handleCommitReceipt = () => {
    if (!receiptPreview?.length) return
    const wasEmpty = store.totalCount === 0
    const commit = () => {
      for (const row of receiptPreview) {
        store.addItem(row.name, row.amount, { side: row.side, slotIndex: row.slotIndex })
      }
      const n = receiptPreview.length
      trackEvent('pantry_add', { method: intakeDraft?.kind ?? 'text', count: n })
      if (wasEmpty) {
        try {
          Taro.setStorageSync(STORAGE_KEYS.firstIntakeCompleted, '1')
        } catch {
          /* ignore */
        }
        trackEvent('first_intake_done', { count: n })
      }
      setReceiptPreview(null)
      setReceiptText('')
      setShowReceipt(false)
      clearIntakeDraft()
      setIntakeDraft(null)
      Taro.showToast({ title: `已入库 ${n} 项`, icon: 'success' })
      if (wasEmpty) {
        setTimeout(() => {
          Taro.showModal({
            title: '冰箱建好了',
            content: '要不要看看今晚能做什么？',
            confirmText: '看今晚方案',
            cancelText: '稍后再说',
            success: (r) => {
              if (!r.confirm) return
              const names = store.items.map((i) => i.name)
              const q = encodeURIComponent(names.join(','))
              Taro.navigateTo({
                url: `/pages/result/index?from=meal&ingredients=${q}&source=first-intake`,
              })
            },
          })
        }, 400)
      }
    }
    const dupRows = receiptPreview.filter((r) => r.duplicateOf.length > 0)
    if (dupRows.length > 0) {
      Taro.showModal({
        title: `${dupRows.length} 样冰箱里已经有了`,
        content: `${dupRows.map((r) => r.name).join('、')}\n\n这些可能是重复采购，仍要全部入库吗？`,
        confirmText: '全部入库',
        cancelText: '我再核对',
        success: (r) => {
          if (r.confirm) commit()
        },
      })
      return
    }
    commit()
  }

  const handleCloseReceipt = () => {
    setShowReceipt(false)
    setReceiptText('')
    setReceiptPreview(null)
    clearIntakeDraft()
    setIntakeDraft(null)
  }

  /** useDidShow 内调用：处理 pending 动作与 intake draft */
  const restoreIntakeOnShow = () => {
    const pending = consumePantryPendingAction()
    if (pending === 'paste') {
      setReceiptPreview(null)
      setReceiptText('')
      setIntakeDraft(null)
      setShowReceipt(true)
    }

    const draft = readIntakeDraft()
    if (!draft) return
    setIntakeDraft(draft)
    setIntakeScene(draft.scene ?? 'ingredients')
    setShowReceipt(true)
    setReceiptPreview(null)
    if (
      (draft.kind === 'photo' || draft.kind === 'album') &&
      draft.capturedAt !== recognizedDraftAtRef.current
    ) {
      recognizedDraftAtRef.current = draft.capturedAt
      void runVisionRecognition(draft, draft.scene ?? 'auto')
    }
  }

  return {
    showReceipt,
    receiptText,
    receiptPreview,
    intakeDraft,
    intakeScene,
    visionLoading,
    setReceiptText,
    setReceiptPreview,
    openImageIntake,
    openPasteIntake,
    handleParseReceipt,
    handleCommitReceipt,
    handleCloseReceipt,
    restoreIntakeOnShow,
    runVisionRecognition,
  }
}
