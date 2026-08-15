import { View, Text, Input, Picker, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { useHouseholdStore, usePantryStore } from '../../../store/context'
import { householdApiConfigured } from '../../../api/household'
import { AppIcon } from '../../../components/AppIcon'
import { ExpandChevron } from '../../../components/ExpandChevron'
import { D } from '../../../theme/designTokens'
import { primeShoppingShare } from '../../../utils/shareLinks'
import { buildDuplicateWarning } from '../../../utils/duplicateGuard'
import {
  formatRemindLabel,
  loadShoppingRemindDate,
  remindDateStillValid,
  scheduleShoppingReminder,
  todayYmd,
} from '../../../utils/shoppingRemind'
import type { HouseholdShoppingItem } from '../../../types/household'

type Props = {
  forceExpand?: boolean
}

function ShoppingRow({
  item,
  onToggle,
}: {
  item: HouseholdShoppingItem
  onToggle: () => void
}) {
  return (
    <View
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0',
        borderBottom: `0.5px solid ${D.separatorLight}`,
      }}
      onClick={onToggle}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          border: item.checked ? `2px solid ${D.accent}` : `1.5px solid ${D.separator}`,
          backgroundColor: item.checked ? D.accent : 'transparent',
          flexShrink: 0,
        }}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: D.body,
            color: item.checked ? D.labelTertiary : D.label,
            textDecoration: item.checked ? 'line-through' : 'none',
          }}
        >
          {item.name}
        </Text>
        <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 2 }}>
          {item.amount}
          {householdApiConfigured() && item.addedBy ? ` · ${item.addedBy}添加` : ''}
        </Text>
      </View>
    </View>
  )
}

function Capsule({
  label,
  accent,
  onClick,
}: {
  label: string
  accent?: boolean
  onClick: () => void
}) {
  return (
    <View
      className="tap-scale"
      style={{
        flex: 1,
        height: 40,
        borderRadius: 999,
        backgroundColor: accent ? D.accent : D.bg,
        border: accent ? 'none' : `0.5px solid ${D.separator}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <Text
        style={{
          fontSize: D.caption,
          fontWeight: accent ? D.weightSemibold : D.weightRegular,
          color: accent ? D.onAccent : D.labelSecondary,
        }}
      >
        {label}
      </Text>
    </View>
  )
}

function ShoppingListPanelInner({ forceExpand }: Props) {
  const householdStore = useHouseholdStore()
  const pantryStore = usePantryStore()
  const [expanded, setExpanded] = useState(true)
  const [draftName, setDraftName] = useState('')
  const [remindYmd, setRemindYmd] = useState(() => {
    const saved = loadShoppingRemindDate()
    return saved && remindDateStillValid(saved) ? saved : ''
  })
  const pending = householdStore.shoppingList.filter((i) => !i.checked)
  const checkedCount = householdStore.shoppingList.filter((i) => i.checked).length
  const householdSyncOn = householdApiConfigured() && householdStore.inHousehold

  useEffect(() => {
    if (forceExpand) setExpanded(true)
  }, [forceExpand])

  const cardStyle = {
    backgroundColor: D.bgElevated,
    borderRadius: D.radiusM,
    padding: 16,
    marginBottom: 10,
    border: `0.5px solid ${D.separatorLight}`,
  }

  const shareList = () => {
    const items = pending.map((i) => ({ name: i.name, amount: i.amount || '适量' }))
    if (items.length === 0) {
      Taro.showToast({ title: '没有待买项可分享', icon: 'none' })
      return
    }
    primeShoppingShare({ title: '爱心厨房采购', items })
  }

  const addDraft = () => {
    const name = draftName.trim()
    if (!name) {
      Taro.showToast({ title: '先填要买的食材', icon: 'none' })
      return
    }
    householdStore.addShoppingItems([{ name, amount: '适量' }])
    setDraftName('')
    Taro.showToast({ title: '已加入待买', icon: 'success' })
  }

  const stockChecked = () => {
    const checked = householdStore.shoppingList.filter((i) => i.checked)
    if (checked.length === 0) {
      Taro.showToast({ title: '先勾选已买到的', icon: 'none' })
      return
    }
    const dupNames = checked
      .filter((i) => pantryStore.findSimilarItems(i.name).length > 0)
      .map((i) => i.name)
    const run = () => {
      const { stocked } = householdStore.stockCheckedToPantry()
      if (stocked > 0) {
        Taro.showToast({ title: `已放入冰箱 ${stocked} 样`, icon: 'success' })
      }
    }
    if (dupNames.length === 0) {
      run()
      return
    }
    Taro.showModal({
      title: '冰箱里好像已经有了',
      content: `${buildDuplicateWarning(dupNames[0], pantryStore.findSimilarItems(dupNames[0]))}\n\n仍把勾选的 ${checked.length} 样入库？`,
      confirmText: '仍要入库',
      cancelText: '再看看',
      success: (r) => {
        if (r.confirm) run()
      },
    })
  }

  const handleRemindChange = (ymd: string) => {
    setRemindYmd(ymd)
    void scheduleShoppingReminder({
      ymd,
      itemNames: pending.map((i) => i.name),
    }).then((result) => {
      if (result === 'calendar') {
        Taro.showToast({ title: `已写入日历 · ${formatRemindLabel(ymd)}`, icon: 'success' })
      } else if (result === 'ics') {
        Taro.showToast({ title: '已下载日历文件，用系统日历打开', icon: 'none' })
      } else if (result === 'copied') {
        Taro.showToast({ title: '已复制提醒文案，可贴进待办', icon: 'none' })
      } else {
        Taro.showToast({ title: '没能写入系统提醒', icon: 'none' })
      }
    })
  }

  return (
    <View id="shopping-panel" style={cardStyle}>
      <View
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <View
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <AppIcon name="cart" size={16} color={D.accent} backgroundColor={D.accentMuted} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.label }}>
              采购清单
            </Text>
            <Text className="lk-block" style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 4 }}>
              {pending.length > 0
                ? `${pending.length} 样待买 · 勾选后放入冰箱`
                : householdStore.shoppingList.length > 0
                ? '全部已勾选，放入冰箱或删除'
                : '缺的食材买回来，直接入库'}
            </Text>
          </View>
        </View>
        <ExpandChevron expanded={expanded} />
      </View>

      {expanded ? (
        <View style={{ marginTop: 14 }}>
          {householdSyncOn && householdStore.lastUpdatedLabel ? (
            <Text
              style={{
                fontSize: D.caption,
                color: D.labelSecondary,
                marginBottom: 10,
                display: 'block',
              }}
            >
              已与家庭同步 · {householdStore.lastUpdatedLabel}
            </Text>
          ) : null}

          {householdStore.shoppingList.length > 0 ? (
            <>
              {householdStore.shoppingList.map((item) => (
                <ShoppingRow
                  key={item.id}
                  item={item}
                  onToggle={() => householdStore.toggleShoppingItem(item.id)}
                />
              ))}
              <View style={{ marginTop: 12 }}>
                <Capsule
                  label={checkedCount > 0 ? `已买 ${checkedCount} 样，放入冰箱` : '勾选已买的，放入冰箱'}
                  accent
                  onClick={stockChecked}
                />
              </View>
              <View style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Capsule label="删除已勾选" onClick={() => householdStore.removeCheckedShopping()} />
                <Button
                  openType="share"
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 999,
                    backgroundColor: D.accentMuted,
                    color: D.accentDeep,
                    fontSize: D.caption,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: 0,
                    padding: 0,
                    lineHeight: 1,
                  }}
                  onClick={shareList}
                >
                  <View style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AppIcon
                      name="share"
                      size={14}
                      color={D.accent}
                      backgroundColor="transparent"
                      glyphOnly
                    />
                    <Text style={{ fontSize: D.caption, color: D.accentDeep }}>分享清单</Text>
                  </View>
                </Button>
              </View>
            </>
          ) : (
            <Text
              className="lk-block"
              style={{
                fontSize: D.footnote,
                color: D.labelTertiary,
                lineHeight: 1.6,
                padding: '4px 0 8px',
              }}
            >
              从菜谱或缺货方案加入，或在下面自己记一笔。买完勾选，一键放进冰箱。
            </Text>
          )}

          <View
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 12,
              paddingTop: 12,
              borderTop: `0.5px solid ${D.separatorLight}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Input
              value={draftName}
              placeholder="再记一样要买的"
              placeholderStyle={`color: ${D.labelTertiary}`}
              style={{ flex: 1, fontSize: D.footnote, height: 36 }}
              confirmType="done"
              onInput={(e) => setDraftName(e.detail.value)}
              onConfirm={addDraft}
            />
            <Text
              style={{ fontSize: D.caption, color: D.accentDeep, fontWeight: D.weightSemibold }}
              onClick={addDraft}
            >
              添加
            </Text>
          </View>

          <Picker
            mode="date"
            value={remindYmd || todayYmd()}
            start={todayYmd()}
            onChange={(e) => handleRemindChange(String(e.detail.value))}
          >
            <View
              style={{
                marginTop: 12,
                padding: '10px 12px',
                borderRadius: D.radiusS,
                backgroundColor: D.accentMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: D.caption, fontWeight: D.weightSemibold, color: D.accentDeep }}>
                  {remindYmd ? `购买提醒 · ${formatRemindLabel(remindYmd)}` : '设置购买日提醒'}
                </Text>
                <Text className="lk-block" style={{ fontSize: 11, color: D.labelTertiary, marginTop: 4 }}>
                  写入手机日历（带闹钟）。微信不能直接建系统待办，日历是能提醒你去超市的方式。
                </Text>
              </View>
              <Text style={{ fontSize: D.caption, color: D.accentDeep }}>选日期</Text>
            </View>
          </Picker>
        </View>
      ) : null}
    </View>
  )
}

export const ShoppingListPanel = observer(ShoppingListPanelInner)
