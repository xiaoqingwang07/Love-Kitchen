import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useState, useMemo, useEffect, type CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'
import { usePantryStore, useHouseholdStore } from '../../store/context'
import { getDaysLeft } from '../../types/pantry'
import type { PantryItem } from '../../types/pantry'
import type { FridgeSide } from '../../types/fridge'
import {
  FRIDGE_LAYOUT_PRESETS,
  slotTitle,
  type FridgeLayoutConfig,
} from '../../types/fridge'
import { buildDuplicateWarning } from '../../utils/duplicateGuard'
import { VoiceRecorderSheet } from '../../components/VoiceRecorderSheet'
import { isAsrAvailable } from '../../utils/voiceAsr'
import { usesLlmProxy } from '../../api/recipe'
import { trackEvent } from '../../utils/analytics'
import { decodeShoppingShare } from '../../utils/shareLinks'
import { FridgeCabinet } from './components/FridgeCabinet'
import { IntakeSheet } from './components/IntakeSheet'
import { SupermarketLookup, cleanSupermarketLookupQuery } from './components/SupermarketLookup'
import { PantryItemEditSheet } from './components/PantryItemEditSheet'
import { FridgeLayoutSettingsSheet } from './components/FridgeLayoutSettingsSheet'
import { SlotDetailSheet } from './components/SlotDetailSheet'
import { PantryHeader } from './components/PantryHeader'
import { QuickFillPanel } from './components/QuickFillPanel'
import { ExpiryOverview, type HighlightMode } from './components/ExpiryOverview'
import { PantryEmptyHint } from './components/PantryEmptyHint'
import { PantryBottomBar } from './components/PantryBottomBar'
import { usePantryIntake } from './usePantryIntake'
import { loadFridgeLayoutConfig, saveFridgeLayoutConfig } from '../../utils/fridgeLayoutStorage'
import { D } from '../../theme/designTokens'

function loadFridgeLayout(): FridgeLayoutConfig {
  return loadFridgeLayoutConfig()
}

function saveFridgeLayout(layout: FridgeLayoutConfig): void {
  saveFridgeLayoutConfig(layout)
}

const pad = D.pagePadH
const DAY_MS = 24 * 60 * 60 * 1000
const PANTRY_BOTTOM_RESERVE = 'calc(156px + env(safe-area-inset-bottom))'

function FridgePantry() {
  const store = usePantryStore()
  const householdStore = useHouseholdStore()
  const router = useRouter()
  const [highlight, setHighlight] = useState<HighlightMode>('all')
  const [activeSlot, setActiveSlot] = useState<{ side: FridgeSide; slotIndex: number } | null>(null)
  const [addName, setAddName] = useState('')
  const [addAmount, setAddAmount] = useState('')
  const [editing, setEditing] = useState<PantryItem | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editDaysLeft, setEditDaysLeft] = useState<number>(0)
  const [layout, setLayout] = useState<FridgeLayoutConfig>(() => loadFridgeLayout())
  const [showLayoutSettings, setShowLayoutSettings] = useState(false)
  const [quickFill, setQuickFill] = useState<string[]>([])

  const intake = usePantryIntake(store, layout)

  // 逛超市模式：站在货架前秒查"家里还有没有"
  const [lookupQuery, setLookupQuery] = useState('')
  const [showVoiceLookup, setShowVoiceLookup] = useState(false)

  const toggleQuickFill = (name: string) => {
    setQuickFill((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const handleLookupVoice = (text: string) => {
    setShowVoiceLookup(false)
    const name = cleanSupermarketLookupQuery(text)
    if (name) setLookupQuery(name)
  }

  const lookupName = cleanSupermarketLookupQuery(lookupQuery)
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
    void householdStore.syncOnShow()

    const sharedShop = decodeShoppingShare(router.params.shop)
    if (sharedShop?.items.length) {
      trackEvent('share_open', { kind: 'shopping', count: sharedShop.items.length })
      const lines = sharedShop.items.map((i) => `${i.name} ${i.amount}`).join('\n')
      Taro.showModal({
        title: sharedShop.title || '朋友分享的采购清单',
        content: lines.slice(0, 200) + (lines.length > 200 ? '…' : ''),
        confirmText: '复制清单',
        cancelText: '关闭',
        success: (r) => {
          if (r.confirm) {
            Taro.setClipboardData({
              data: lines,
              success: () => Taro.showToast({ title: '已复制', icon: 'success' }),
            })
          }
        },
      })
    }

    intake.restoreIntakeOnShow()
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

  const handleSlotClick = (side: FridgeSide, slotIndex: number) => {
    setActiveSlot({ side, slotIndex })
    setAddName('')
    setAddAmount('')
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

  const slotItems = (side: FridgeSide, slotIndex: number): PantryItem[] => {
    const count = layout[side === 'freezer' ? 'freezerSlots' : 'fridgeSlots']
    const last = count - 1
    return store.items.filter((i) => {
      if (i.side !== side) return false
      if (slotIndex === last) return i.slotIndex >= last
      return i.slotIndex === slotIndex
    })
  }

  const activeItems = useMemo(() => {
    if (!activeSlot) return []
    return slotItems(activeSlot.side, activeSlot.slotIndex)
  }, [activeSlot, store.items, layout])

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
    <View style={{ minHeight: '100vh', backgroundColor: D.bg, paddingBottom: PANTRY_BOTTOM_RESERVE }}>
      <ScrollView scrollY showScrollbar={false} style={{ paddingBottom: PANTRY_BOTTOM_RESERVE }}>
        <PantryHeader
          pad={pad}
          presetName={currentPreset.name}
          onOpenLayoutSettings={() => setShowLayoutSettings(true)}
        />

        {store.totalCount > 0 ? (
          <SupermarketLookup
            pad={pad}
            lookupQuery={lookupQuery}
            lookupResults={lookupResults}
            onLookupQueryChange={setLookupQuery}
            onSelectItem={(side, slotIndex) => setActiveSlot({ side, slotIndex })}
            onVoiceClick={() => {
              if (!isAsrAvailable()) {
                Taro.showToast({ title: '语音暂不可用，请手动输入', icon: 'none' })
                return
              }
              setShowVoiceLookup(true)
            }}
          />
        ) : null}

        {store.totalCount === 0 ? (
          <QuickFillPanel
            pad={pad}
            selected={quickFill}
            onToggle={toggleQuickFill}
            onCommit={commitQuickFill}
          />
        ) : null}

        <ExpiryOverview
          pad={pad}
          totalCount={store.totalCount}
          expiringCount={store.expiringCount}
          expiredCount={store.expiredCount}
          expiringNames={store.expiringItems.map((i) => i.name)}
          highlight={highlight}
          onHighlightChange={setHighlight}
        />

        {store.totalCount === 0 ? <PantryEmptyHint pad={pad} /> : null}

        {/* 冰箱本体 */}
        <View style={{ padding: `0 ${pad}px 28px` }}>
          <View style={fridgeCabinet}>
            <FridgeCabinet
              layout={layout}
              items={store.items}
              highlight={highlight}
              freezerIndices={freezerIndices}
              fridgeIndices={fridgeIndices}
              onSlotClick={handleSlotClick}
            />
          </View>
        </View>

        <View style={{ padding: `0 ${pad}px ${PANTRY_BOTTOM_RESERVE}` }}>
          <Text className="lk-block" style={{ fontSize: D.caption, color: D.labelTertiary, lineHeight: 1.5 }}>
            点格子手动添加；底部可拍照识别小票/食材，或粘贴清单批量入库。
          </Text>
        </View>
      </ScrollView>

      <FridgeLayoutSettingsSheet
        visible={showLayoutSettings}
        pad={pad}
        layout={layout}
        onClose={() => setShowLayoutSettings(false)}
        onApplyPreset={applyPreset}
        onAdjustSlotCount={adjustSlotCount}
      />

      <SlotDetailSheet
        slot={activeSlot}
        pad={pad}
        items={activeItems}
        addName={addName}
        addAmount={addAmount}
        onAddNameChange={setAddName}
        onAddAmountChange={setAddAmount}
        onClose={() => setActiveSlot(null)}
        onAdd={handleAddToSlot}
        onEditItem={setEditing}
      />

      <PantryItemEditSheet
        item={editing}
        pad={pad}
        editAmount={editAmount}
        editDaysLeft={editDaysLeft}
        onEditAmountChange={setEditAmount}
        onEditDaysLeftChange={(delta) => setEditDaysLeft((d) => Math.max(0, d + delta))}
        onClose={() => setEditing(null)}
        onSave={handleSaveEdit}
        onDelete={() => {
          if (!editing) return
          const id = editing.id
          Taro.showModal({
            title: '删除',
            content: `把「${editing.name}」从冰箱删除？`,
            confirmColor: D.red,
            success: (r) => {
              if (r.confirm) {
                store.removeItem(id)
                setEditing(null)
                Taro.showToast({ title: '已删除', icon: 'none' })
              }
            },
          })
        }}
        onMove={() => editing && handleMoveItem(editing)}
      />

      <IntakeSheet
        visible={intake.showReceipt}
        pad={pad}
        intakeScene={intake.intakeScene}
        intakeDraft={intake.intakeDraft}
        visionLoading={intake.visionLoading}
        receiptPreview={intake.receiptPreview}
        receiptText={intake.receiptText}
        llmAvailable={usesLlmProxy()}
        onReceiptTextChange={intake.setReceiptText}
        onClose={intake.handleCloseReceipt}
        onParse={intake.handleParseReceipt}
        onCommit={intake.handleCommitReceipt}
        onClearPreview={() => intake.setReceiptPreview(null)}
        onRerunVision={() => {
          if (intake.intakeDraft) void intake.runVisionRecognition(intake.intakeDraft, intake.intakeScene)
        }}
      />

      <PantryBottomBar
        pad={pad}
        expiredCount={store.expiredCount}
        onReceiptIntake={() => intake.openImageIntake('receipt')}
        onIngredientsIntake={() => intake.openImageIntake('ingredients')}
        onPasteIntake={intake.openPasteIntake}
        onClearExpired={() => {
          Taro.showModal({
            title: '清理过期',
            content: `把 ${store.expiredCount} 项过期食材一次性移除？`,
            confirmColor: D.red,
            success: (r) => {
              if (r.confirm) {
                store.removeExpired()
                Taro.showToast({ title: '已清理', icon: 'success' })
              }
            },
          })
        }}
      />

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
