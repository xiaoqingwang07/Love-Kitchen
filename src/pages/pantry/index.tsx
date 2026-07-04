import { View, Text, Input, Button, ScrollView, Textarea, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo, useEffect, useRef, type CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'
import { usePantryStore } from '../../store/context'
import { getFreshnessStatus, getDaysLeft } from '../../types/pantry'
import type { PantryItem, FreshnessStatus } from '../../types/pantry'
import type { FridgeSide } from '../../types/fridge'
import {
  DEFAULT_FRIDGE_LAYOUT,
  FRIDGE_LAYOUT_PRESETS,
  normalizeFridgeLayout,
  slotCountForSide,
  slotKind,
  slotTitle,
  type FridgeLayoutConfig,
} from '../../types/fridge'
import { parseShoppingLines } from '../../utils/fridgePlacement'
import { buildIntakePreview, previewToReceiptText, type IntakePreviewRow } from '../../utils/pantryIntake'
import { buildDuplicateWarning, describeExisting } from '../../utils/duplicateGuard'
import { VoiceRecorderSheet } from '../../components/VoiceRecorderSheet'
import { isAsrAvailable } from '../../utils/voiceAsr'
import { recognizePantryImage, PantryVisionError } from '../../api/pantryVision'
import { usesLlmProxy } from '../../api/recipe'
import { trackEvent } from '../../utils/analytics'
import {
  readIntakeDraft,
  clearIntakeDraft,
  pickImageForIntake,
  type IntakeDraft,
  type IntakeScene,
} from '../../utils/mediaIntake'
import { D } from '../../theme/designTokens'
import { slotShortLabel } from '../../utils/slotLabel'
import { STORAGE_KEYS } from '../../store/storageKeys'

type HighlightMode = 'all' | 'expiring' | 'expired'

const pad = D.pagePadH
const SLOT_PULL_MIN = 56
const SLOT_DRAWER_MIN = 62
const SLOT_STACK_GAP = 5
const DAY_MS = 24 * 60 * 60 * 1000

/** 空冰箱「快速补货」候选：覆盖常见家庭食材，点选即入库 */
const QUICK_FILL_ITEMS = [
  '鸡蛋', '牛奶', '西红柿', '黄瓜', '土豆', '胡萝卜',
  '青椒', '猪肉', '鸡胸肉', '豆腐', '生菜', '大葱',
]

function loadFridgeLayout(): FridgeLayoutConfig {
  try {
    return normalizeFridgeLayout(Taro.getStorageSync(STORAGE_KEYS.fridgeLayoutConfig))
  } catch {
    return DEFAULT_FRIDGE_LAYOUT
  }
}

function saveFridgeLayout(layout: FridgeLayoutConfig): void {
  try {
    Taro.setStorageSync(STORAGE_KEYS.fridgeLayoutConfig, layout)
  } catch {
    /* ignore */
  }
}

function FridgePantry() {
  const store = usePantryStore()
  const [highlight, setHighlight] = useState<HighlightMode>('all')
  const [activeSlot, setActiveSlot] = useState<{ side: FridgeSide; slotIndex: number } | null>(null)
  const [addName, setAddName] = useState('')
  const [addAmount, setAddAmount] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptText, setReceiptText] = useState('')
  const [receiptPreview, setReceiptPreview] = useState<IntakePreviewRow[] | null>(null)
  const [intakeDraft, setIntakeDraft] = useState<IntakeDraft | null>(null)
  const [intakeScene, setIntakeScene] = useState<IntakeScene>('receipt')
  const [visionLoading, setVisionLoading] = useState(false)
  const recognizedDraftAtRef = useRef(0)
  const [editing, setEditing] = useState<PantryItem | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editDaysLeft, setEditDaysLeft] = useState<number>(0)
  const [layout, setLayout] = useState<FridgeLayoutConfig>(() => loadFridgeLayout())
  const [showLayoutSettings, setShowLayoutSettings] = useState(false)
  const [quickFill, setQuickFill] = useState<string[]>([])

  // 逛超市模式：站在货架前秒查"家里还有没有"
  const [lookupQuery, setLookupQuery] = useState('')
  const [showVoiceLookup, setShowVoiceLookup] = useState(false)

  const toggleQuickFill = (name: string) => {
    setQuickFill((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const cleanLookup = (raw: string): string => {
    let s = (raw || '').trim()
    const isQuestion = /[吗呢]$|没有?$/u.test(s)
    s = s.replace(/(吗|呢|啊|嘛|没有|没|在不在)$/u, '')
    const LEAD = [
      '查查', '查一下', '查下', '看一下', '看看', '看下', '帮我看看', '帮我看',
      '我想买', '想买', '要买', '家里还', '家里', '我家', '冰箱里', '冰箱',
      '还有没有', '有没有', '还有', '还剩', '剩没剩', '还', '剩', '查', '买',
    ]
    let changed = true
    while (changed) {
      changed = false
      for (const t of LEAD) {
        if (s.startsWith(t) && s.length > t.length) {
          s = s.slice(t.length)
          changed = true
          break
        }
      }
    }
    // 仅在明确疑问句时才削掉开头的"有"，避免误伤"有机xx"
    if (isQuestion && s.startsWith('有') && !s.startsWith('有机') && s.length > 1) {
      s = s.slice(1)
    }
    return s.trim()
  }

  const handleLookupVoice = (text: string) => {
    setShowVoiceLookup(false)
    const name = cleanLookup(text)
    if (name) setLookupQuery(name)
  }

  const lookupName = cleanLookup(lookupQuery)
  const lookupResults = lookupName ? store.findSimilarItems(lookupName) : null

  const commitQuickFill = () => {
    if (quickFill.length === 0) return
    const dupNames = quickFill.filter((n) => store.findSimilarItems(n).length > 0)
    const fresh = quickFill.filter((n) => store.findSimilarItems(n).length === 0)
    const doAdd = (names: string[]) => {
      for (const name of names) store.addItem(name, '适量')
      trackEvent('pantry_add', { method: 'quick_fill', count: names.length })
      setQuickFill([])
      if (names.length > 0) {
        Taro.showToast({ title: `已加入 ${names.length} 样`, icon: 'success' })
      }
    }
    if (dupNames.length > 0) {
      Taro.showModal({
        title: '这些冰箱里已经有了',
        content: `${dupNames.join('、')}\n\n已有的就不重复加了，只入库新的 ${fresh.length} 样？`,
        confirmText: `只加新的`,
        cancelText: '全部都加',
        success: (r) => doAdd(r.confirm ? fresh : quickFill),
      })
      return
    }
    doAdd(quickFill)
  }

  useDidShow(() => {
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
  })

  useEffect(() => {
    if (editing) {
      setEditAmount(editing.amount)
      setEditDaysLeft(Math.max(0, getDaysLeft(editing)))
    }
  }, [editing])

  useEffect(() => {
    saveFridgeLayout(layout)
  }, [layout])

  const freezerIndices = useMemo(
    () => Array.from({ length: layout.freezerSlots }, (_, i) => i),
    [layout.freezerSlots]
  )
  const fridgeIndices = useMemo(
    () => Array.from({ length: layout.fridgeSlots }, (_, i) => i),
    [layout.fridgeSlots]
  )
  const currentPreset = FRIDGE_LAYOUT_PRESETS.find((p) => p.type === layout.type) || FRIDGE_LAYOUT_PRESETS[0]

  // ---------- 冰箱外柜视觉 ----------
  const fridgeCabinet: CSSProperties = {
    borderRadius: 22,
    padding: 4,
    background: 'linear-gradient(145deg, #b8c0cc 0%, #dde3ea 38%, #c9d0da 72%, #aeb6c2 100%)',
    boxShadow: '0 12px 40px rgba(18, 22, 28, 0.14), inset 0 1px 0 rgba(255,255,255,0.65)',
  }
  const freezerChamber: CSSProperties = {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    padding: '8px 7px 10px',
    position: 'relative',
    background:
      'linear-gradient(168deg, #d8e6f5 0%, #c5d8ed 28%, #b8cce8 55%, #a8bedd 100%)',
    border: '1px solid rgba(255,255,255,0.5)',
    boxShadow:
      'inset 0 3px 14px rgba(255,255,255,0.45), inset 0 -8px 24px rgba(25,55,95,0.12)',
    display: 'flex',
    flexDirection: 'column',
  }
  const fridgeChamber: CSSProperties = {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    padding: '8px 7px 10px',
    position: 'relative',
    background:
      'linear-gradient(168deg, #f4faf6 0%, #e8f2eb 30%, #dce8df 60%, #d0dfd3 100%)',
    border: '1px solid rgba(255,255,255,0.55)',
    boxShadow:
      'inset 0 3px 14px rgba(255,255,255,0.55), inset 0 -8px 24px rgba(45,75,55,0.08)',
    display: 'flex',
    flexDirection: 'column',
  }
  const frostOverlay: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)',
    pointerEvents: 'none',
  }
  const ledBar = (isFz: boolean): CSSProperties => ({
    height: 4,
    borderRadius: 2,
    marginBottom: 2,
    background: isFz
      ? 'linear-gradient(90deg, rgba(120,170,230,0.35), rgba(200,230,255,0.9), rgba(120,170,230,0.35))'
      : 'linear-gradient(90deg, rgba(140,200,160,0.25), rgba(230,255,240,0.85), rgba(140,200,160,0.25))',
    boxShadow: '0 0 8px rgba(255,255,255,0.6)',
  })

  // ---------- 逻辑 ----------
  const slotItems = (side: FridgeSide, slotIndex: number): PantryItem[] => {
    const count = slotCountForSide(layout, side)
    const last = count - 1
    return store.items.filter((i) => {
      if (i.side !== side) return false
      if (slotIndex === last) return i.slotIndex >= last
      return i.slotIndex === slotIndex
    })
  }

  const slotHasHighlight = (side: FridgeSide, slotIndex: number): boolean => {
    const list = slotItems(side, slotIndex)
    if (highlight === 'all') return true
    return list.some((i) => {
      const s = getFreshnessStatus(i)
      return highlight === 'expiring' ? s === 'expiring' : s === 'expired'
    })
  }
  const slotDimmed = (side: FridgeSide, slotIndex: number): boolean => {
    if (highlight === 'all') return false
    const list = slotItems(side, slotIndex)
    if (list.length === 0) return true
    return !slotHasHighlight(side, slotIndex)
  }

  const renderSlot = (side: FridgeSide, index: number) => {
    const items = slotItems(side, index)
    const kind = slotKind(index)
    const dim = slotDimmed(side, index)
    const hasExpired = items.some((i) => getFreshnessStatus(i) === 'expired')
    const hasExpiring = items.some((i) => getFreshnessStatus(i) === 'expiring')
    const ring =
      highlight !== 'all' &&
      items.some((i) =>
        getFreshnessStatus(i) ===
        (highlight === 'expiring' ? 'expiring' : 'expired')
      )
    const minH = kind === 'pull' ? SLOT_PULL_MIN : SLOT_DRAWER_MIN
    const isFz = side === 'freezer'
    const summary = items.length === 0 ? '空' : items.map((i) => i.name).join('、')
    const sideColor = isFz ? '#4E8FC5' : '#5E9D72'
    return (
      <View
        key={`${side}-${index}`}
        style={{
          minHeight: minH,
          width: '100%',
          borderRadius: 12,
          backgroundColor: 'rgba(255,255,255,0.72)',
          border: ring
            ? `1.5px solid ${highlight === 'expiring' ? D.accentWarm : D.red}`
            : '0.5px solid rgba(255,255,255,0.9)',
          boxShadow:
            '0 1px 8px rgba(18,17,15,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
          padding: '8px 9px',
          opacity: dim ? 0.35 : 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          boxSizing: 'border-box',
          flex: 1,
          alignSelf: 'stretch',
          position: 'relative',
        }}
        onClick={() => {
          setActiveSlot({ side, slotIndex: index })
          setAddName('')
          setAddAmount('')
        }}
      >
        {/* 右上角默认状态点（不受 highlight 影响） */}
        {hasExpired || hasExpiring ? (
          <View
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: hasExpired ? D.red : D.accentWarm,
              boxShadow: `0 0 0 2px ${isFz ? 'rgba(216,230,245,0.9)' : 'rgba(244,250,246,0.9)'}`,
            }}
          />
        ) : null}

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontWeight: '700',
              color: sideColor,
              letterSpacing: '0.06em',
            }}
          >
            {kind === 'pull' ? `搁板 ${index + 1}` : `抽屉 ${index - 3}`}
          </Text>
          {items.length > 0 ? (
            <View
              style={{
                backgroundColor: isFz ? 'rgba(78,143,197,0.12)' : 'rgba(94,157,114,0.12)',
                padding: '2px 7px',
                borderRadius: 999,
                flexShrink: 0,
                marginRight: hasExpired || hasExpiring ? 12 : 0,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: '700', color: sideColor }}>
                {items.length}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: items.length === 0 ? D.labelTertiary : D.label,
            marginTop: 4,
            lineHeight: 1.45,
          }}
        >
          {summary}
        </Text>
      </View>
    )
  }

  const renderZone = (
    side: FridgeSide,
    indices: number[],
    opts: { compact?: boolean; title?: string } = {}
  ) => {
    const isFz = side === 'freezer'
    const chamber = isFz ? freezerChamber : fridgeChamber
    return (
      <View style={{ ...chamber, minHeight: opts.compact ? 120 : 0 }}>
        <View style={isFz ? frostOverlay : undefined} />
        <View style={ledBar(isFz)} />
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: 2,
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: D.weightBold,
              color: isFz ? '#1e3a5c' : '#2d4a38',
              letterSpacing: '-0.02em',
            }}
          >
            {opts.title || (isFz ? '冷冻室' : '冷藏室')}
          </Text>
          <Text
            style={{
              fontSize: 9,
              fontWeight: D.weightSemibold,
              color: isFz ? 'rgba(30,58,92,0.55)' : 'rgba(45,74,56,0.5)',
            }}
          >
            {isFz ? '≈ −18°C' : '≈ 4°C'}
          </Text>
        </View>
        <View style={{ display: 'flex', flexDirection: 'column', gap: SLOT_STACK_GAP, flex: 1 }}>
          {indices.map((idx) => (
            <View key={`${side}-${idx}`} style={{ display: 'flex', flex: 1 }}>
              {renderSlot(side, idx)}
            </View>
          ))}
        </View>
      </View>
    )
  }

  const renderFridgeBody = () => {
    if (layout.type === 'side-by-side') {
      const rows = Array.from({ length: Math.max(layout.freezerSlots, layout.fridgeSlots) }, (_, i) => i)
      return (
        <View style={{ display: 'flex', flexDirection: 'column' }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', padding: '6px 4px 8px', gap: 6 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              {renderZone('freezer', freezerIndices, { title: '冷冻室' })}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              {renderZone('fridge', fridgeIndices, { title: '冷藏室' })}
            </View>
          </View>
          <View style={{ display: 'none' }}>
            {rows.length}
          </View>
        </View>
      )
    }

    if (layout.type === 'top-freezer') {
      return (
        <View style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 4px 8px' }}>
          {renderZone('freezer', freezerIndices, { compact: true, title: '上冷冻' })}
          {renderZone('fridge', fridgeIndices, { title: '下冷藏' })}
        </View>
      )
    }

    if (layout.type === 'bottom-freezer') {
      return (
        <View style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 4px 8px' }}>
          {renderZone('fridge', fridgeIndices, { title: '上冷藏' })}
          {renderZone('freezer', freezerIndices, { compact: true, title: '下冷冻' })}
        </View>
      )
    }

    if (layout.type === 'single-door') {
      return (
        <View style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 4px 8px' }}>
          {renderZone('freezer', freezerIndices, { compact: true, title: '小冷冻格' })}
          {renderZone('fridge', fridgeIndices, { title: '主冷藏区' })}
        </View>
      )
    }

    return (
      <View style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 4px 8px' }}>
        {renderZone('fridge', fridgeIndices, { title: layout.type === 'french-door' ? '上层冷藏' : '上层冷藏' })}
        <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            {renderZone('freezer', freezerIndices.slice(0, Math.ceil(freezerIndices.length / 2)), { compact: true, title: '下左冷冻' })}
          </View>
          <View style={{ flex: 1 }}>
            {renderZone('freezer', freezerIndices.slice(Math.ceil(freezerIndices.length / 2)), { compact: true, title: '下右冷冻' })}
          </View>
        </View>
      </View>
    )
  }

  const handleAddToSlot = () => {
    if (!activeSlot) return
    if (!addName.trim()) {
      Taro.showToast({ title: '填写名称', icon: 'none' })
      return
    }
    const name = addName.trim()
    const amount = addAmount.trim() || '适量'
    const commit = () => {
      store.addItem(name, amount, {
        side: activeSlot.side,
        slotIndex: activeSlot.slotIndex,
      })
      trackEvent('pantry_add', { method: 'manual', count: 1 })
      setAddName('')
      setAddAmount('')
      Taro.showToast({ title: '已放入', icon: 'success' })
    }
    const dups = store.findSimilarItems(name)
    if (dups.length > 0) {
      Taro.showModal({
        title: '冰箱里好像已经有了',
        content: buildDuplicateWarning(name, dups),
        confirmText: '仍要添加',
        cancelText: '算了不买',
        success: (r) => { if (r.confirm) commit() },
      })
      return
    }
    commit()
  }

  const handleParseReceipt = () => {
    const lines = parseShoppingLines(receiptText)
    if (lines.length === 0) {
      Taro.showToast({ title: '请先输入清单', icon: 'none' })
      return
    }
    setReceiptPreview(buildIntakePreview(lines, store.items, layout))
  }

  const runVisionRecognition = async (draft: IntakeDraft, mode: IntakeScene | 'auto' = 'auto') => {
    if (draft.kind !== 'photo' && draft.kind !== 'album') return
    if (!usesLlmProxy()) {
      Taro.showToast({ title: '未配置 AI，请手动输入清单', icon: 'none' })
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
      const msg =
        e instanceof PantryVisionError ? e.message : '识别失败，请手动核对清单'
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

  const handleCommitReceipt = () => {
    if (!receiptPreview?.length) return
    const commit = () => {
      for (const row of receiptPreview) {
        store.addItem(row.name, row.amount, { side: row.side, slotIndex: row.slotIndex })
      }
      const n = receiptPreview.length
      trackEvent('pantry_add', { method: intakeDraft?.kind ?? 'text', count: n })
      setReceiptPreview(null)
      setReceiptText('')
      setShowReceipt(false)
      clearIntakeDraft()
      setIntakeDraft(null)
      Taro.showToast({ title: `已入库 ${n} 项`, icon: 'success' })
    }
    const dupRows = receiptPreview.filter((r) => r.duplicateOf.length > 0)
    if (dupRows.length > 0) {
      Taro.showModal({
        title: `${dupRows.length} 样冰箱里已经有了`,
        content: `${dupRows.map((r) => r.name).join('、')}\n\n这些可能是重复采购，仍要全部入库吗？`,
        confirmText: '全部入库',
        cancelText: '我再核对',
        success: (r) => { if (r.confirm) commit() },
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

  const activeItems = useMemo(() => {
    if (!activeSlot) return []
    return slotItems(activeSlot.side, activeSlot.slotIndex)
  }, [activeSlot, store.items, layout])

  const getStatusStyle = (status: FreshnessStatus): CSSProperties => {
    if (status === 'expired') return { color: D.red, backgroundColor: 'rgba(208,90,56,0.12)' }
    if (status === 'expiring') return { color: D.accentWarm, backgroundColor: D.accentWarmMuted }
    return { color: D.green, backgroundColor: 'rgba(74,140,108,0.12)' }
  }

  const handleSaveEdit = () => {
    if (!editing) return
    store.updateItem(editing.id, {
      amount: editAmount,
      expiresAt: Date.now() + Math.max(0, editDaysLeft) * DAY_MS,
    })
    setEditing(null)
    Taro.showToast({ title: '已更新', icon: 'success' })
  }

  const handleMoveItem = (item: PantryItem) => {
    const freezerTargets = freezerIndices.map((idx) => ({
      label: slotTitle('freezer', idx),
      side: 'freezer' as FridgeSide,
      slotIndex: idx,
    }))
    const fridgeTargets = fridgeIndices.map((idx) => ({
      label: slotTitle('fridge', idx),
      side: 'fridge' as FridgeSide,
      slotIndex: idx,
    }))
    const targets = [...freezerTargets, ...fridgeTargets]
    Taro.showActionSheet({
      itemList: targets.map((t) => t.label),
      success: (res) => {
        const dest = targets[res.tapIndex]
        if (!dest) return
        store.moveItem(item.id, dest.side, dest.slotIndex)
        setEditing(null)
        Taro.showToast({ title: '已移动', icon: 'success' })
      },
    })
  }

  const applyPreset = (idx: number) => {
    const preset = FRIDGE_LAYOUT_PRESETS[idx]
    if (!preset) return
    setLayout({ type: preset.type, freezerSlots: preset.freezerSlots, fridgeSlots: preset.fridgeSlots })
  }

  const adjustSlotCount = (side: FridgeSide, delta: number) => {
    setLayout((prev) => {
      const key = side === 'freezer' ? 'freezerSlots' : 'fridgeSlots'
      return {
        ...prev,
        [key]: Math.max(1, Math.min(9, prev[key] + delta)),
      }
    })
  }

  return (
    <View style={{ minHeight: '100vh', backgroundColor: D.bg, paddingBottom: 120 }}>
      <ScrollView scrollY showScrollbar={false}>
        <View style={{ padding: `44px ${pad}px 12px` }}>
          <View style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <Text
              style={{
                fontSize: D.titleLarge,
                fontWeight: D.weightBold,
                color: D.label,
                letterSpacing: '-0.04em',
              }}
            >
              冰箱
            </Text>
            <View
              className="tap-scale"
              onClick={() => setShowLayoutSettings(true)}
              style={{
                marginTop: 3,
                padding: '6px 10px',
                borderRadius: 999,
                backgroundColor: D.bgElevated,
                border: `0.5px solid ${D.separatorLight}`,
                boxShadow: '0 1px 6px rgba(18,17,15,0.04)',
                flexShrink: 0,
              }}
            >
              <Text style={{ fontSize: D.caption, fontWeight: D.weightSemibold, color: D.labelSecondary }}>
                {currentPreset.name}
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontSize: D.footnote,
              color: D.labelSecondary,
              marginTop: 8,
              lineHeight: 1.5,
              maxWidth: 340,
            }}
          >
            点格子查看 / 添加，食材会自动标记临期（黄）和过期（红）。
          </Text>
        </View>

        {/* 逛超市秒查：在货架前先查家里有没有，防止重复买 */}
        {store.totalCount > 0 ? (
          <View
            style={{
              margin: `0 ${pad}px 14px`,
              padding: 14,
              backgroundColor: D.bgElevated,
              borderRadius: D.radiusL,
              border: `0.5px solid ${D.separatorLight}`,
              boxShadow: D.shadowCard,
            }}
          >
            <View style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 999,
                  backgroundColor: D.bgGrouped,
                }}
              >
                <Text style={{ fontSize: 15, color: D.labelTertiary }}>🔍</Text>
                <Input
                  value={lookupQuery}
                  placeholder="逛超市先查冰箱：想买什么？"
                  placeholderStyle={`color:${D.labelTertiary}`}
                  confirmType="search"
                  onInput={(e) => setLookupQuery(e.detail.value)}
                  style={{
                    flex: 1,
                    fontSize: D.callout,
                    color: D.label,
                    height: 40,
                  }}
                />
                {lookupQuery ? (
                  <Text
                    className="tap-scale"
                    onClick={() => setLookupQuery('')}
                    style={{ fontSize: 15, color: D.labelTertiary, padding: '0 2px' }}
                  >
                    ✕
                  </Text>
                ) : null}
              </View>
              <View
                className="tap-scale"
                onClick={() => {
                  if (!isAsrAvailable()) {
                    Taro.showToast({ title: '语音暂不可用，请手动输入', icon: 'none' })
                    return
                  }
                  setShowVoiceLookup(true)
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  backgroundColor: D.accentMuted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Text style={{ fontSize: 18 }}>🎤</Text>
              </View>
            </View>

            {/* 结果区 */}
            {!lookupName ? (
              <Text
                style={{
                  fontSize: D.caption,
                  color: D.labelTertiary,
                  marginTop: 10,
                  lineHeight: 1.5,
                }}
              >
                拿不准家里还有没有？输入或说一句「有没有西红柿」，立刻知道在哪、放了多久。
              </Text>
            ) : lookupResults && lookupResults.length > 0 ? (
              (() => {
                const hasOld = lookupResults.some(
                  (it) => getFreshnessStatus(it) !== 'fresh'
                )
                return (
                  <View
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: D.radiusM,
                      backgroundColor: hasOld ? D.accentWarmMuted : D.accentMuted,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: D.subheadline,
                        fontWeight: D.weightBold,
                        color: hasOld ? D.orange : D.accent,
                      }}
                    >
                      {hasOld
                        ? `家里有「${lookupName}」了，先别买`
                        : `家里有「${lookupName}」`}
                    </Text>
                    {lookupResults.map((it) => (
                      <View
                        key={it.id}
                        className="tap-scale"
                        onClick={() =>
                          setActiveSlot({ side: it.side, slotIndex: it.slotIndex })
                        }
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginTop: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: D.footnote,
                            color: D.label,
                            fontWeight: D.weightMedium,
                          }}
                        >
                          {it.name}（{it.amount}）
                        </Text>
                        <Text
                          style={{
                            fontSize: D.caption,
                            color: D.labelSecondary,
                            flexShrink: 0,
                          }}
                        >
                          {describeExisting(it)} ›
                        </Text>
                      </View>
                    ))}
                    {hasOld ? (
                      <Text
                        style={{
                          fontSize: D.caption,
                          color: D.orange,
                          marginTop: 8,
                          lineHeight: 1.4,
                        }}
                      >
                        有临期 / 过期的，回家先吃旧的，别再囤。
                      </Text>
                    ) : null}
                  </View>
                )
              })()
            ) : (
              <View
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: D.radiusM,
                  backgroundColor: D.bgGrouped,
                }}
              >
                <Text
                  style={{
                    fontSize: D.subheadline,
                    fontWeight: D.weightSemibold,
                    color: D.label,
                  }}
                >
                  🛒 家里没有「{lookupName}」，可以买
                </Text>
                <Text
                  style={{
                    fontSize: D.caption,
                    color: D.labelTertiary,
                    marginTop: 4,
                    lineHeight: 1.4,
                  }}
                >
                  没查到同类库存（叫法不同也可能查不到，可换个常用名再试）。
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* 空冰箱快速补货（仅空库时出现，压缩 time-to-value） */}
        {store.totalCount === 0 ? (
          <View
            style={{
              margin: `0 ${pad}px 14px`,
              padding: 16,
              backgroundColor: D.bgElevated,
              borderRadius: D.radiusM,
              border: `0.5px solid ${D.separatorLight}`,
            }}
          >
            <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.label }}>
              30 秒建好你的冰箱
            </Text>
            <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 4, lineHeight: 1.5 }}>
              点几样常买的，先把冰箱填起来 · 也可拍照 / 小票批量导入
            </Text>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {QUICK_FILL_ITEMS.map((name) => {
                const on = quickFill.includes(name)
                return (
                  <View
                    key={name}
                    className="tap-scale"
                    style={{
                      padding: '7px 14px',
                      borderRadius: 999,
                      backgroundColor: on ? D.accent : D.bg,
                      border: on ? 'none' : `0.5px solid ${D.separator}`,
                    }}
                    onClick={() => toggleQuickFill(name)}
                  >
                    <Text
                      style={{
                        fontSize: D.footnote,
                        fontWeight: D.weightSemibold,
                        color: on ? '#fff' : D.labelSecondary,
                      }}
                    >
                      {name}
                    </Text>
                  </View>
                )
              })}
            </View>
            {quickFill.length > 0 ? (
              <View
                className="tap-scale"
                style={{
                  marginTop: 14,
                  padding: '11px 0',
                  borderRadius: D.radiusM,
                  backgroundColor: D.label,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={commitQuickFill}
              >
                <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.bgElevated }}>
                  加入冰箱（{quickFill.length}）
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* 临期概览（有库存时才出现） */}
        {store.totalCount > 0 ? (
          <View
            style={{
              margin: `0 ${pad}px 14px`,
              display: 'flex',
              gap: 10,
            }}
          >
            <View
              style={{
                flex: 1,
                padding: '12px 14px',
                backgroundColor: D.bgElevated,
                borderRadius: D.radiusM,
                border: `0.5px solid ${D.separatorLight}`,
              }}
            >
              <Text
                style={{
                  fontSize: D.caption,
                  color: D.labelTertiary,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                }}
              >
                共
              </Text>
              <Text
                style={{
                  fontSize: D.title,
                  fontWeight: D.weightBold,
                  color: D.label,
                  marginTop: 2,
                  letterSpacing: '-0.02em',
                }}
              >
                {store.totalCount}
                <Text style={{ fontSize: D.caption, color: D.labelTertiary, fontWeight: D.weightRegular }}>
                  {' '}
                  项
                </Text>
              </Text>
            </View>
            {store.expiringCount > 0 ? (
              <View
                className="tap-scale"
                onClick={() => setHighlight('expiring')}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  backgroundColor: D.accentWarmMuted,
                  borderRadius: D.radiusM,
                  border: `0.5px solid ${D.accentLine}`,
                }}
              >
                <Text
                  style={{
                    fontSize: D.caption,
                    color: D.accentWarm,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  临期
                </Text>
                <Text
                  style={{
                    fontSize: D.title,
                    fontWeight: D.weightBold,
                    color: D.accentWarm,
                    marginTop: 2,
                  }}
                >
                  {store.expiringCount}
                </Text>
                {/* 点击跳转选菜页，并自动勾选所有临期食材 */}
                <View
                  className="tap-scale"
                  onClick={(e) => {
                    e.stopPropagation()
                    const expiringNames = store.expiringItems.map(i => i.name)
                    Taro.setStorageSync(STORAGE_KEYS.pickAutoSelectIngredients, expiringNames)
                    Taro.switchTab({ url: '/pages/pick/index' })
                  }}
                  style={{
                    marginTop: 8,
                    backgroundColor: D.accentWarm,
                    borderRadius: 99,
                    padding: '4px 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                <Text style={{ fontSize: 10, color: '#fff', fontWeight: D.weightSemibold }}>去选菜</Text>
                </View>
              </View>
            ) : null}
            {store.expiredCount > 0 ? (
              <View
                className="tap-scale"
                onClick={() => setHighlight('expired')}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  backgroundColor: D.errorBg,
                  borderRadius: D.radiusM,
                  border: `0.5px solid rgba(208,90,56,0.2)`,
                }}
              >
                <Text
                  style={{
                    fontSize: D.caption,
                    color: D.red,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  过期
                </Text>
                <Text
                  style={{
                    fontSize: D.title,
                    fontWeight: D.weightBold,
                    color: D.red,
                    marginTop: 2,
                  }}
                >
                  {store.expiredCount}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {store.totalCount === 0 ? (
          <View
            style={{
              margin: `0 ${pad}px 14px`,
              padding: '16px 18px',
              backgroundColor: D.bgElevated,
              borderRadius: D.radiusM,
              border: `0.5px solid ${D.separatorLight}`,
            }}
          >
            <Text style={{ fontSize: D.body, fontWeight: D.weightSemibold, color: D.label }}>
              先填一些食材
            </Text>
            <Text
              style={{
                fontSize: D.footnote,
                color: D.labelSecondary,
                lineHeight: 1.5,
                marginTop: 6,
              }}
            >
              点任意格子可手动录入，或从下方「采购清单」粘贴一批。
            </Text>
          </View>
        ) : null}

        {/* 高亮过滤 */}
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 8,
            padding: `0 ${pad}px`,
            marginBottom: 16,
          }}
        >
          {(
            [
              { k: 'all' as HighlightMode, t: '全貌' },
              { k: 'expiring' as HighlightMode, t: '只看临期' },
              { k: 'expired' as HighlightMode, t: '只看过期' },
            ] as const
          ).map(({ k, t }) => (
            <View
              key={k}
              className="tap-scale"
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                backgroundColor: highlight === k ? D.label : D.bgElevated,
                border: highlight === k ? 'none' : `0.5px solid ${D.separator}`,
              }}
              onClick={() => setHighlight(k)}
            >
              <Text
                style={{
                  fontSize: D.footnote,
                  fontWeight: D.weightSemibold,
                  color: highlight === k ? D.bgElevated : D.labelSecondary,
                }}
              >
                {t}
              </Text>
            </View>
          ))}
        </View>

        {/* 冰箱本体 */}
        <View style={{ padding: `0 ${pad}px 28px` }}>
          <View style={fridgeCabinet}>
            {renderFridgeBody()}
          </View>
        </View>

        <View style={{ padding: `0 ${pad}px 100px` }}>
          <Text style={{ fontSize: D.caption, color: D.labelTertiary, lineHeight: 1.5 }}>
            点格子手动添加；底部可拍照识别小票/食材，或粘贴清单批量入库。
          </Text>
        </View>
      </ScrollView>

      {/* 低频设置：冰箱类型与格数 */}
      {showLayoutSettings ? (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(18,17,15,0.36)',
            zIndex: 190,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setShowLayoutSettings(false)}
        >
          <View
            style={{
              width: '100%',
              backgroundColor: D.bgElevated,
              borderTopLeftRadius: D.radiusXL,
              borderTopRightRadius: D.radiusXL,
              padding: `18px ${pad}px`,
              paddingBottom: 'calc(22px + env(safe-area-inset-bottom))',
              boxShadow: D.shadowLift,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: D.separator,
                margin: '0 auto 16px',
              }}
            />
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: D.headline, fontWeight: D.weightBold, color: D.label }}>
                  冰箱设置
                </Text>
                <Text style={{ display: 'block', marginTop: 4, fontSize: D.footnote, color: D.labelSecondary }}>
                  低频设置，选定后一般无需再改
                </Text>
              </View>
              <View
                className="tap-scale"
                onClick={() => setShowLayoutSettings(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: D.bgGrouped,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 18, color: D.labelSecondary }}>×</Text>
              </View>
            </View>

            <Text style={{ display: 'block', marginTop: 16, marginBottom: 8, fontSize: D.caption, color: D.labelTertiary }}>
              类型
            </Text>
            <ScrollView scrollX showScrollbar={false} style={{ whiteSpace: 'nowrap' }}>
              <View style={{ display: 'flex', gap: 8 }}>
                {FRIDGE_LAYOUT_PRESETS.map((preset, idx) => {
                  const active = preset.type === layout.type
                  return (
                    <View
                      key={preset.type}
                      className="tap-scale"
                      onClick={() => applyPreset(idx)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 999,
                        backgroundColor: active ? D.label : D.bgGrouped,
                        border: active ? 'none' : `0.5px solid ${D.separatorLight}`,
                      }}
                    >
                      <Text style={{ fontSize: D.footnote, fontWeight: D.weightSemibold, color: active ? D.bgElevated : D.labelSecondary }}>
                        {preset.name}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </ScrollView>

            <View style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              {([
                { side: 'freezer' as FridgeSide, title: '冷冻格数', value: layout.freezerSlots, color: '#4E8FC5' },
                { side: 'fridge' as FridgeSide, title: '冷藏格数', value: layout.fridgeSlots, color: '#5E9D72' },
              ]).map((item) => (
                <View
                  key={item.side}
                  style={{
                    flex: 1,
                    backgroundColor: D.bgGrouped,
                    borderRadius: D.radiusL,
                    padding: '11px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: `0.5px solid ${D.separatorLight}`,
                  }}
                >
                  <View>
                    <Text style={{ fontSize: D.caption, color: D.labelTertiary }}>{item.title}</Text>
                    <Text style={{ display: 'block', fontSize: D.title, fontWeight: D.weightBold, color: item.color, marginTop: 2 }}>
                      {item.value}
                    </Text>
                  </View>
                  <View style={{ display: 'flex', gap: 6 }}>
                    {[
                      { label: '−', delta: -1 },
                      { label: '+', delta: 1 },
                    ].map((btn) => (
                      <View
                        key={btn.label}
                        className="tap-scale"
                        onClick={() => adjustSlotCount(item.side, btn.delta)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `0.5px solid ${D.separatorLight}`,
                          boxShadow: '0 1px 4px rgba(18,17,15,0.05)',
                        }}
                      >
                        <Text style={{ fontSize: 18, lineHeight: '28px', color: D.label }}>{btn.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {/* 格内详情 sheet */}
      {activeSlot ? (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(18,17,15,0.5)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setActiveSlot(null)}
        >
          <View
            style={{
              width: '100%',
              maxHeight: '82%',
              backgroundColor: D.bgElevated,
              borderTopLeftRadius: D.radiusXL,
              borderTopRightRadius: D.radiusXL,
              padding: `20px ${pad}px`,
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
              boxShadow: D.shadowLift,
            }}
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: D.separator,
                alignSelf: 'center',
                margin: '0 auto 16px',
              }}
            />
            <Text
              style={{
                fontSize: D.headline,
                fontWeight: D.weightBold,
                color: D.label,
                letterSpacing: '-0.02em',
              }}
            >
              {slotTitle(activeSlot.side, activeSlot.slotIndex)}
            </Text>
            <Text style={{ fontSize: D.footnote, color: D.labelTertiary, marginTop: 4 }}>
              {slotShortLabel(activeSlot.side, activeSlot.slotIndex)}
            </Text>

            <ScrollView scrollY style={{ maxHeight: 240, marginTop: 16 }}>
              {activeItems.map((item) => {
                const st = getFreshnessStatus(item)
                const stStyle = getStatusStyle(st)
                const daysLeft = getDaysLeft(item)
                return (
                  <View
                    key={item.id}
                    className="tap-scale"
                    onClick={() => setEditing(item)}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: `0.5px solid ${D.separatorLight}`,
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          fontSize: D.body,
                          fontWeight: D.weightSemibold,
                          color: D.label,
                        }}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: D.caption,
                          color: D.labelTertiary,
                          marginTop: 2,
                        }}
                      >
                        {item.amount}
                      </Text>
                      <View
                        style={{
                          marginTop: 6,
                          alignSelf: 'flex-start',
                          padding: '3px 8px',
                          borderRadius: 6,
                          ...stStyle,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: D.weightSemibold,
                            color: stStyle.color,
                          }}
                        >
                          {st === 'expired'
                            ? '已过期'
                            : st === 'expiring'
                            ? `${daysLeft} 天到期`
                            : `${daysLeft} 天`}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        fontSize: D.caption,
                        color: D.labelTertiary,
                        padding: '0 6px',
                      }}
                    >
                      编辑
                    </Text>
                  </View>
                )
              })}
              {activeItems.length === 0 ? (
                <Text
                  style={{
                    fontSize: D.footnote,
                    color: D.labelTertiary,
                    padding: '12px 0',
                  }}
                >
                  这一格还空着
                </Text>
              ) : null}
            </ScrollView>

            <Text
              style={{
                fontSize: D.caption,
                fontWeight: D.weightSemibold,
                color: D.labelSecondary,
                marginTop: 16,
                marginBottom: 8,
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
              }}
            >
              放入此格
            </Text>
            <Input
              style={{
                height: 48,
                backgroundColor: D.bg,
                borderRadius: D.radiusS,
                padding: '0 14px',
                fontSize: D.body,
                marginBottom: 8,
              }}
              placeholder="名称"
              value={addName}
              onInput={(e) => setAddName(e.detail.value)}
            />
            <Input
              style={{
                height: 48,
                backgroundColor: D.bg,
                borderRadius: D.radiusS,
                padding: '0 14px',
                fontSize: D.body,
                marginBottom: 12,
              }}
              placeholder="数量，如 2 个 / 500g"
              value={addAmount}
              onInput={(e) => setAddAmount(e.detail.value)}
            />
            <Button
              style={{
                height: 48,
                borderRadius: 999,
                backgroundColor: D.accent,
                color: '#fff',
                fontSize: D.subheadline,
                fontWeight: D.weightSemibold,
                border: 'none',
              }}
              onClick={handleAddToSlot}
            >
              放入
            </Button>
            <Button
              style={{
                marginTop: 10,
                height: 42,
                borderRadius: 999,
                backgroundColor: 'transparent',
                color: D.labelSecondary,
                fontSize: D.footnote,
                border: 'none',
              }}
              onClick={() => setActiveSlot(null)}
            >
              关闭
            </Button>
          </View>
        </View>
      ) : null}

      {/* 编辑 item sheet */}
      {editing ? (
        <View
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(18,17,15,0.55)',
            zIndex: 260,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setEditing(null)}
        >
          <View
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              backgroundColor: D.bgElevated,
              borderTopLeftRadius: D.radiusXL,
              borderTopRightRadius: D.radiusXL,
              padding: `20px ${pad}px`,
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
              boxShadow: D.shadowLift,
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: D.separator,
                alignSelf: 'center',
                margin: '0 auto 16px',
              }}
            />
            <Text style={{ fontSize: D.headline, fontWeight: D.weightBold, color: D.label }}>
              {editing.name}
            </Text>
            <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 4 }}>
              当前位置：{slotShortLabel(editing.side, editing.slotIndex)}
            </Text>

            <Text
              style={{
                fontSize: D.caption,
                fontWeight: D.weightSemibold,
                color: D.labelSecondary,
                marginTop: 18,
                marginBottom: 6,
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
              }}
            >
              数量
            </Text>
            <Input
              style={{
                height: 48,
                backgroundColor: D.bg,
                borderRadius: D.radiusS,
                padding: '0 14px',
                fontSize: D.body,
              }}
              value={editAmount}
              onInput={(e) => setEditAmount(e.detail.value)}
            />

            <Text
              style={{
                fontSize: D.caption,
                fontWeight: D.weightSemibold,
                color: D.labelSecondary,
                marginTop: 16,
                marginBottom: 6,
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
              }}
            >
              还能放几天
            </Text>
            <View style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <View
                className="tap-scale"
                onClick={() => setEditDaysLeft((d) => Math.max(0, d - 1))}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: D.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20, color: D.label }}>−</Text>
              </View>
              <Text
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 28,
                  fontWeight: D.weightBold,
                  color: D.label,
                }}
              >
                {editDaysLeft}
                <Text style={{ fontSize: D.footnote, color: D.labelTertiary, fontWeight: D.weightRegular }}>
                  {' '}天
                </Text>
              </Text>
              <View
                className="tap-scale"
                onClick={() => setEditDaysLeft((d) => d + 1)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: D.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20, color: D.label }}>+</Text>
              </View>
            </View>

            <View style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Button
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 999,
                  backgroundColor: D.errorBg,
                  color: D.errorFg,
                  fontSize: D.footnote,
                  fontWeight: D.weightSemibold,
                  border: 'none',
                }}
                onClick={() => {
                  const id = editing.id
                  Taro.showModal({
                    title: '删除',
                    content: `把「${editing.name}」从冰箱删除？`,
                    confirmColor: '#F5412C',
                    success: (r) => {
                      if (r.confirm) {
                        store.removeItem(id)
                        setEditing(null)
                        Taro.showToast({ title: '已删除', icon: 'none' })
                      }
                    },
                  })
                }}
              >
                删除
              </Button>
              <Button
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 999,
                  backgroundColor: D.bg,
                  color: D.label,
                  fontSize: D.footnote,
                  fontWeight: D.weightSemibold,
                  border: `0.5px solid ${D.separator}`,
                }}
                onClick={() => handleMoveItem(editing)}
              >
                换位置
              </Button>
              <Button
                style={{
                  flex: 1.4,
                  height: 48,
                  borderRadius: 999,
                  backgroundColor: D.accent,
                  color: '#fff',
                  fontSize: D.footnote,
                  fontWeight: D.weightSemibold,
                  border: 'none',
                }}
                onClick={handleSaveEdit}
              >
                保存
              </Button>
            </View>
            <Button
              style={{
                marginTop: 10,
                height: 42,
                borderRadius: 999,
                backgroundColor: 'transparent',
                color: D.labelSecondary,
                fontSize: D.footnote,
                border: 'none',
              }}
              onClick={() => setEditing(null)}
            >
              取消
            </Button>
          </View>
        </View>
      ) : null}

      {/* 采购清单 / 小票入库 */}
      {showReceipt ? (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(18,17,15,0.55)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: pad,
          }}
          onClick={handleCloseReceipt}
        >
          <View
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: D.bgElevated,
              borderRadius: D.radiusXL,
              padding: 22,
              maxHeight: '86%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: D.shadowLift,
            }}
          >
            <Text style={{ fontSize: D.headline, fontWeight: D.weightBold, color: D.label }}>
              {intakeScene === 'receipt' ? '小票 / 采购入库' : intakeScene === 'ingredients' ? '食材识别入库' : '采购清单'}
            </Text>
            <Text
              style={{
                fontSize: D.caption,
                color: D.labelTertiary,
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              {visionLoading
                ? 'AI 正在识别图片中的食材…'
                : '拍照或粘贴清单，系统会推荐冷冻/冷藏格位，入库前可复核。'}
            </Text>

            {intakeDraft?.kind === 'photo' || intakeDraft?.kind === 'album' ? (
              <View
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: D.radiusM,
                  backgroundColor: D.bg,
                }}
              >
                <Image
                  src={intakeDraft.filePath}
                  mode="aspectFill"
                  style={{
                    width: '100%',
                    height: 140,
                    borderRadius: D.radiusS,
                    backgroundColor: D.bgElevated,
                  }}
                />
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 10,
                    gap: 8,
                  }}
                >
                  <Text style={{ flex: 1, fontSize: D.caption, color: D.labelSecondary, lineHeight: 1.45 }}>
                    {intakeScene === 'receipt' ? '购物小票' : '食材照片'}
                    {visionLoading ? ' · 识别中…' : receiptPreview ? ' · 已识别' : ' · 可重新识别'}
                  </Text>
                  {usesLlmProxy() && !visionLoading ? (
                    <Text
                      className="tap-scale"
                      style={{ fontSize: D.footnote, color: D.accent, fontWeight: D.weightSemibold }}
                      onClick={() => void runVisionRecognition(intakeDraft, intakeScene)}
                    >
                      重新识别
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {intakeDraft?.kind === 'voice' ? (
              <View
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: D.radiusM,
                  backgroundColor: D.bg,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Text style={{ fontSize: 20 }}>🎧</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: D.footnote, color: D.label, fontWeight: D.weightSemibold }}>
                    语音备忘
                  </Text>
                  <Text
                    style={{
                      fontSize: D.caption,
                      color: D.labelTertiary,
                      marginTop: 2,
                    }}
                  >
                    约 {Math.round((intakeDraft.durationMs ?? 0) / 1000)} 秒 · 边听边写
                  </Text>
                </View>
                <Text
                  className="tap-scale"
                  style={{
                    fontSize: D.footnote,
                    color: D.accent,
                    fontWeight: D.weightSemibold,
                  }}
                  onClick={() => {
                    try {
                      const ctx = Taro.createInnerAudioContext()
                      ctx.src = intakeDraft.filePath
                      ctx.play()
                    } catch (e) {
                      console.warn('audio play failed', e)
                    }
                  }}
                >
                  播放
                </Text>
              </View>
            ) : null}

            {!receiptPreview && !visionLoading ? (
              <Textarea
                style={{
                  width: '100%',
                  minHeight: 140,
                  marginTop: 14,
                  padding: '12px 14px',
                  borderRadius: D.radiusS,
                  border: `0.5px solid ${D.separator}`,
                  fontSize: D.subheadline,
                  boxSizing: 'border-box',
                  backgroundColor: D.bg,
                }}
                placeholder="每行一件，例：西红柿 500g"
                value={receiptText}
                maxlength={2000}
                onInput={(e) => setReceiptText(e.detail.value)}
              />
            ) : null}
            {visionLoading ? (
              <View style={{ marginTop: 24, alignItems: 'center', padding: 20 }}>
                <Text style={{ fontSize: D.subheadline, color: D.labelSecondary }}>识别中，请稍候…</Text>
              </View>
            ) : null}
            {receiptPreview ? (
              <ScrollView scrollY style={{ maxHeight: 280, marginTop: 14, flex: 1 }}>
                {receiptPreview.map((row, i) => (
                  <View
                    key={i}
                    style={{
                      paddingTop: 10,
                      paddingBottom: 10,
                      borderBottom: `0.5px solid ${D.separatorLight}`,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: D.subheadline,
                        fontWeight: D.weightSemibold,
                        color: D.label,
                      }}
                    >
                      {row.name}{' '}
                      <Text
                        style={{
                          fontWeight: D.weightRegular,
                          color: D.labelTertiary,
                          fontSize: D.caption,
                        }}
                      >
                        {row.amount}
                      </Text>
                    </Text>
                    <Text style={{ fontSize: D.caption, color: D.accent, marginTop: 4 }}>
                      推荐 {slotShortLabel(row.side, row.slotIndex)}
                    </Text>
                    {row.duplicateOf.length > 0 ? (
                      <Text
                        style={{
                          fontSize: D.caption,
                          color: D.orange,
                          marginTop: 4,
                          fontWeight: D.weightMedium,
                        }}
                      >
                        ⚠ 冰箱里已有 · {describeExisting(row.duplicateOf[0])}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            ) : null}
            <View style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              {!receiptPreview ? (
                <>
                  <Button
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 999,
                      backgroundColor: D.bg,
                      color: D.label,
                      border: 'none',
                      fontSize: D.footnote,
                    }}
                    onClick={handleCloseReceipt}
                  >
                    取消
                  </Button>
                  <Button
                    style={{
                      flex: 1.4,
                      height: 48,
                      borderRadius: 999,
                      backgroundColor: D.accent,
                      color: '#fff',
                      border: 'none',
                      fontSize: D.footnote,
                      fontWeight: D.weightSemibold,
                    }}
                    onClick={handleParseReceipt}
                  >
                    解析并预览
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 999,
                      backgroundColor: D.bg,
                      border: 'none',
                      fontSize: D.footnote,
                    }}
                    onClick={() => setReceiptPreview(null)}
                  >
                    返回编辑
                  </Button>
                  <Button
                    style={{
                      flex: 1.4,
                      height: 48,
                      borderRadius: 999,
                      backgroundColor: D.accent,
                      color: '#fff',
                      border: 'none',
                      fontSize: D.footnote,
                      fontWeight: D.weightSemibold,
                    }}
                    onClick={handleCommitReceipt}
                  >
                    确认入库
                  </Button>
                </>
              )}
            </View>
          </View>
        </View>
      ) : null}

      {/* 底部主操作条 */}
      <View
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          padding: `12px ${pad}px`,
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          backgroundColor: D.bgGlassHeavy,
          backdropFilter: 'blur(20px)',
          borderTop: `0.5px solid ${D.separatorLight}`,
          boxSizing: 'border-box',
        }}
      >
        <View style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Button
            style={{
              flex: 1,
              height: 46,
              borderRadius: 999,
              backgroundColor: D.accent,
              color: '#fff',
              fontSize: D.footnote,
              fontWeight: D.weightSemibold,
              border: 'none',
            }}
            onClick={() => openImageIntake('receipt')}
          >
            📷 拍小票
          </Button>
          <Button
            style={{
              flex: 1,
              height: 46,
              borderRadius: 999,
              backgroundColor: D.bgElevated,
              color: D.label,
              fontSize: D.footnote,
              fontWeight: D.weightSemibold,
              border: `0.5px solid ${D.separator}`,
            }}
            onClick={() => openImageIntake('ingredients')}
          >
            🥬 拍食材
          </Button>
        </View>
        <View style={{ display: 'flex', gap: 10 }}>
        <Button
          style={{
            flex: 1,
            height: 46,
            borderRadius: 999,
            backgroundColor: D.label,
            color: D.bgElevated,
            fontSize: D.footnote,
            fontWeight: D.weightSemibold,
            border: 'none',
          }}
          onClick={() => {
            setReceiptPreview(null)
            setReceiptText('')
            setIntakeDraft(null)
            setShowReceipt(true)
          }}
        >
          粘贴清单
        </Button>
        {store.expiredCount > 0 ? (
          <Button
            style={{
              height: 50,
              borderRadius: 999,
              padding: '0 18px',
              backgroundColor: D.errorBg,
              color: D.errorFg,
              fontSize: D.footnote,
              fontWeight: D.weightSemibold,
              border: 'none',
            }}
            onClick={() => {
              Taro.showModal({
                title: '清理过期',
                content: `把 ${store.expiredCount} 项过期食材一次性移除？`,
                confirmColor: '#F5412C',
                success: (r) => {
                  if (r.confirm) {
                    store.removeExpired()
                    Taro.showToast({ title: '已清理', icon: 'success' })
                  }
                },
              })
            }}
          >
            清过期
          </Button>
        ) : null}
        <Button
          style={{
            height: 50,
            borderRadius: 999,
            padding: '0 18px',
            backgroundColor: D.bgElevated,
            color: D.accent,
            fontSize: D.footnote,
            fontWeight: D.weightSemibold,
            border: `0.5px solid ${D.separator}`,
          }}
          onClick={() => Taro.switchTab({ url: '/pages/pick/index' })}
        >
          去选菜
        </Button>
        </View>
      </View>

      <VoiceRecorderSheet
        visible={showVoiceLookup}
        onClose={() => setShowVoiceLookup(false)}
        onRecorded={() => setShowVoiceLookup(false)}
        onTranscribed={handleLookupVoice}
      />
    </View>
  )
}

export default observer(FridgePantry)
