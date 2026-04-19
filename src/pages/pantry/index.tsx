import { View, Text, Input, Button, ScrollView, Textarea, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo, useEffect, type CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'
import { usePantryStore } from '../../store/context'
import { getCategoryForName } from '../../data/shelfLife'
import { getFreshnessStatus, getDaysLeft } from '../../types/pantry'
import type { PantryItem, FreshnessStatus } from '../../types/pantry'
import type { FridgeSide } from '../../types/fridge'
import { slotKind, slotTitle } from '../../types/fridge'
import { parseShoppingLines, suggestPlacementWithBalance } from '../../utils/fridgePlacement'
import { D } from '../../theme/designTokens'
import { slotShortLabel } from '../../utils/slotLabel'
import {
  readIntakeDraft,
  clearIntakeDraft,
  type IntakeDraft,
} from '../../utils/mediaIntake'

type HighlightMode = 'all' | 'expiring' | 'expired'

const pad = D.pagePadH
const SLOT_PULL_MIN = 56
const SLOT_DRAWER_MIN = 62
const SLOT_STACK_GAP = 5
const SLOT_INDICES = [0, 1, 2, 3, 4, 5, 6] as const
const DAY_MS = 24 * 60 * 60 * 1000

function FridgePantry() {
  const store = usePantryStore()
  const [highlight, setHighlight] = useState<HighlightMode>('all')
  const [activeSlot, setActiveSlot] = useState<{ side: FridgeSide; slotIndex: number } | null>(null)
  const [addName, setAddName] = useState('')
  const [addAmount, setAddAmount] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptText, setReceiptText] = useState('')
  const [receiptPreview, setReceiptPreview] = useState<
    { name: string; amount: string; side: FridgeSide; slotIndex: number }[] | null
  >(null)
  const [intakeDraft, setIntakeDraft] = useState<IntakeDraft | null>(null)
  const [editing, setEditing] = useState<PantryItem | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editDaysLeft, setEditDaysLeft] = useState<number>(0)

  useDidShow(() => {
    const draft = readIntakeDraft()
    if (draft) {
      setIntakeDraft(draft)
      setShowReceipt(true)
      setReceiptPreview(null)
    }
  })

  useEffect(() => {
    if (editing) {
      setEditAmount(editing.amount)
      setEditDaysLeft(Math.max(0, getDaysLeft(editing)))
    }
  }, [editing])

  // ---------- 冰箱外柜视觉 ----------
  const fridgeCabinet: CSSProperties = {
    borderRadius: 22,
    padding: 4,
    background: 'linear-gradient(145deg, #b8c0cc 0%, #dde3ea 38%, #c9d0da 72%, #aeb6c2 100%)',
    boxShadow: '0 12px 40px rgba(18, 22, 28, 0.14), inset 0 1px 0 rgba(255,255,255,0.65)',
  }
  const doorMidSealFill: CSSProperties = {
    width: 6,
    alignSelf: 'stretch',
    flexShrink: 0,
    borderRadius: 2,
    background:
      'linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(255,255,255,0.55) 45%, rgba(0,0,0,0.1) 100%)',
    boxShadow: 'inset 0 0 6px rgba(0,0,0,0.15)',
  }
  const doorHandle = (edge: 'left' | 'right'): CSSProperties => ({
    position: 'absolute',
    top: '40%',
    zIndex: 2,
    ...(edge === 'right' ? { right: 5 } : { left: 5 }),
    width: 4,
    height: 44,
    borderRadius: 2,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(170,178,190,0.95))',
    boxShadow:
      edge === 'right'
        ? 'inset -1px 0 2px rgba(0,0,0,0.08)'
        : 'inset 1px 0 2px rgba(0,0,0,0.08)',
  })
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
  const slotHasHighlight = (side: FridgeSide, slotIndex: number): boolean => {
    const list = store.itemsInSlot(side, slotIndex)
    if (highlight === 'all') return true
    return list.some((i) => {
      const s = getFreshnessStatus(i)
      return highlight === 'expiring' ? s === 'expiring' : s === 'expired'
    })
  }
  const slotDimmed = (side: FridgeSide, slotIndex: number): boolean => {
    if (highlight === 'all') return false
    const list = store.itemsInSlot(side, slotIndex)
    if (list.length === 0) return true
    return !slotHasHighlight(side, slotIndex)
  }

  const renderSlot = (side: FridgeSide, index: number) => {
    const items = store.itemsInSlot(side, index)
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
    return (
      <View
        key={`${side}-${index}`}
        style={{
          minHeight: minH,
          width: '100%',
          borderRadius: 8,
          backgroundColor: isFz ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.52)',
          border: ring
            ? `1.5px solid ${highlight === 'expiring' ? D.accentWarm : D.red}`
            : '1px solid rgba(255,255,255,0.65)',
          boxShadow:
            'inset 0 2px 6px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.7)',
          padding: '6px 8px',
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
              color: isFz ? 'rgba(30,55,90,0.55)' : 'rgba(35,65,45,0.5)',
              letterSpacing: '0.06em',
            }}
          >
            {kind === 'pull' ? `搁板 ${index + 1}` : index === 5 ? '果菜抽屉' : '保鲜抽屉'}
          </Text>
          {items.length > 0 ? (
            <View
              style={{
                backgroundColor: isFz ? 'rgba(255,255,255,0.55)' : D.accentMuted,
                padding: '1px 6px',
                borderRadius: 999,
                flexShrink: 0,
                marginRight: hasExpired || hasExpiring ? 12 : 0,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: '700', color: D.accent }}>
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

  const handleAddToSlot = () => {
    if (!activeSlot) return
    if (!addName.trim()) {
      Taro.showToast({ title: '填写名称', icon: 'none' })
      return
    }
    store.addItem(addName.trim(), addAmount.trim() || '适量', {
      side: activeSlot.side,
      slotIndex: activeSlot.slotIndex,
    })
    setAddName('')
    setAddAmount('')
    Taro.showToast({ title: '已放入', icon: 'success' })
  }

  const handleParseReceipt = () => {
    const lines = parseShoppingLines(receiptText)
    if (lines.length === 0) {
      Taro.showToast({ title: '请先输入清单', icon: 'none' })
      return
    }
    const virtual: PantryItem[] = [...store.items]
    const preview: {
      name: string
      amount: string
      side: FridgeSide
      slotIndex: number
    }[] = []
    for (const line of lines) {
      const cat = getCategoryForName(line.name)
      const p = suggestPlacementWithBalance(line.name, cat, virtual)
      const now = Date.now()
      virtual.push({
        id: 'virt',
        name: line.name,
        category: cat,
        amount: line.amount,
        addedAt: now,
        expiresAt: now,
        defaultShelfLife: 1,
        side: p.side,
        slotIndex: p.slotIndex,
      })
      preview.push({
        name: line.name,
        amount: line.amount,
        side: p.side,
        slotIndex: p.slotIndex,
      })
    }
    setReceiptPreview(preview)
  }

  const handleCommitReceipt = () => {
    if (!receiptPreview?.length) return
    for (const row of receiptPreview) {
      store.addItem(row.name, row.amount, { side: row.side, slotIndex: row.slotIndex })
    }
    setReceiptPreview(null)
    setReceiptText('')
    setShowReceipt(false)
    clearIntakeDraft()
    setIntakeDraft(null)
    Taro.showToast({ title: `已入库 ${receiptPreview.length} 项`, icon: 'success' })
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
    return store.itemsInSlot(activeSlot.side, activeSlot.slotIndex)
  }, [activeSlot, store.items])

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
    Taro.showActionSheet({
      itemList: [
        '冷冻 · 搁板 1',
        '冷冻 · 搁板 2-5',
        '冷冻 · 抽屉',
        '冷藏 · 搁板 1',
        '冷藏 · 搁板 2-5',
        '冷藏 · 抽屉',
      ],
      success: (res) => {
        const slotMap: { side: FridgeSide; slotIndex: number }[] = [
          { side: 'freezer', slotIndex: 0 },
          { side: 'freezer', slotIndex: 2 },
          { side: 'freezer', slotIndex: 5 },
          { side: 'fridge', slotIndex: 0 },
          { side: 'fridge', slotIndex: 2 },
          { side: 'fridge', slotIndex: 5 },
        ]
        const dest = slotMap[res.tapIndex]
        if (!dest) return
        store.moveItem(item.id, dest.side, dest.slotIndex)
        setEditing(null)
        Taro.showToast({ title: '已移动', icon: 'success' })
      },
    })
  }

  return (
    <View style={{ minHeight: '100vh', backgroundColor: D.bg, paddingBottom: 120 }}>
      <ScrollView scrollY showScrollbar={false}>
        <View style={{ padding: `44px ${pad}px 12px` }}>
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
          <Text
            style={{
              fontSize: D.footnote,
              color: D.labelSecondary,
              marginTop: 8,
              lineHeight: 1.5,
              maxWidth: 340,
            }}
          >
            左冷冻、右冷藏。点格子查看 / 添加，食材会自动标记临期（黄）和过期（红）。
          </Text>
        </View>

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
            <View style={{ display: 'flex', flexDirection: 'column' }}>
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}>
                <View
                  style={{
                    ...freezerChamber,
                    borderRadius: 0,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 6,
                  }}
                >
                  <View style={frostOverlay} />
                  <View style={doorHandle('right')} />
                  <View style={ledBar(true)} />
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingRight: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: '#1e3a5c',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      ❄ 冷冻室
                    </Text>
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: '600',
                        color: 'rgba(30,58,92,0.55)',
                      }}
                    >
                      ≈ −18°C
                    </Text>
                  </View>
                </View>
                <View style={doorMidSealFill} />
                <View
                  style={{
                    ...fridgeChamber,
                    borderRadius: 0,
                    borderTopRightRadius: 16,
                    borderTopLeftRadius: 6,
                  }}
                >
                  <View style={doorHandle('left')} />
                  <View style={ledBar(false)} />
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingRight: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: '#2d4a38',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      🥬 冷藏室
                    </Text>
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: '600',
                        color: 'rgba(45,74,56,0.5)',
                      }}
                    >
                      ≈ 4°C
                    </Text>
                  </View>
                </View>
              </View>
              <View
                style={{
                  padding: '6px 4px 8px',
                  borderBottomLeftRadius: 14,
                  borderBottomRightRadius: 14,
                  background:
                    'linear-gradient(90deg, #d2e2f2 0%, #d2e2f2 calc(50% - 3px), #ddece0 calc(50% + 3px), #ddece0 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: SLOT_STACK_GAP,
                }}
              >
                {SLOT_INDICES.map((i) => (
                  <View
                    key={`slot-row-${i}`}
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}
                  >
                    <View style={{ flex: 1, minWidth: 0, display: 'flex' }}>
                      {renderSlot('freezer', i)}
                    </View>
                    <View style={doorMidSealFill} />
                    <View style={{ flex: 1, minWidth: 0, display: 'flex' }}>
                      {renderSlot('fridge', i)}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={{ padding: `0 ${pad}px 100px` }}>
          <Text style={{ fontSize: D.caption, color: D.labelTertiary, lineHeight: 1.5 }}>
            点任一格子添加或编辑；底部「采购清单」支持粘贴多条一次入库。
          </Text>
        </View>
      </ScrollView>

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
                      编辑 ›
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
                    confirmColor: '#D05A38',
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
              采购清单
            </Text>
            <Text
              style={{
                fontSize: D.caption,
                color: D.labelTertiary,
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              每行一件，例：西红柿 500g。系统会根据分类推荐冷冻 / 冷藏与格位，入库前可复核。
            </Text>

            {intakeDraft?.kind === 'photo' || intakeDraft?.kind === 'album' ? (
              <View
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: D.radiusM,
                  backgroundColor: D.bg,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <Image
                  src={intakeDraft.filePath}
                  mode="aspectFill"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: D.radiusS,
                    backgroundColor: D.bgElevated,
                  }}
                />
                <Text style={{ flex: 1, fontSize: D.caption, color: D.labelSecondary, lineHeight: 1.45 }}>
                  你刚才拍的照片，照着把食材写进清单即可。
                </Text>
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

            {!receiptPreview ? (
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
                      推荐 → {slotShortLabel(row.side, row.slotIndex)}
                    </Text>
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
          display: 'flex',
          gap: 10,
          boxSizing: 'border-box',
        }}
      >
        <Button
          style={{
            flex: 1,
            height: 50,
            borderRadius: 999,
            backgroundColor: D.accent,
            color: '#fff',
            fontSize: D.subheadline,
            fontWeight: D.weightSemibold,
            border: 'none',
          }}
          onClick={() => {
            setReceiptPreview(null)
            setShowReceipt(true)
          }}
        >
          采购清单入库
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
                confirmColor: '#D05A38',
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
  )
}

export default observer(FridgePantry)
