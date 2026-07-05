import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useHouseholdStore } from '../../../store/context'
import { householdApiConfigured } from '../../../api/household'
import { AppIcon } from '../../../components/AppIcon'
import { ExpandChevron } from '../../../components/ExpandChevron'
import { D } from '../../../theme/designTokens'
import { primeHouseholdShare } from '../../../utils/shareLinks'

function HouseholdPanelInner() {
  const householdStore = useHouseholdStore()
  const [joinCode, setJoinCode] = useState('')
  const [nickname, setNickname] = useState(householdStore.memberNickname)
  const [expanded, setExpanded] = useState(false)

  if (!householdApiConfigured()) return null

  const copyInvite = () => {
    const code = householdStore.inviteCode
    if (!code) return
    Taro.setClipboardData({
      data: code,
      success: () => Taro.showToast({ title: '邀请码已复制', icon: 'success' }),
    })
  }

  const cardStyle = {
    backgroundColor: D.bgElevated,
    borderRadius: D.radiusM,
    padding: 16,
    marginBottom: 10,
    border: `0.5px solid ${D.separatorLight}`,
  }

  return (
    <View style={cardStyle}>
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
          <AppIcon name="home" size={16} color={D.accent} backgroundColor={D.accentMuted} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.label }}>
              家庭厨房
            </Text>
            <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 4 }}>
              {householdStore.inHousehold
                ? householdStore.lastUpdatedLabel || '与家人共享冰箱和采购清单'
                : '创建家庭，同步冰箱与购物清单'}
            </Text>
          </View>
        </View>
        <ExpandChevron expanded={expanded} />
      </View>

      {expanded ? (
        <View style={{ marginTop: 14 }}>
          <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginBottom: 6 }}>我的称呼</Text>
          <Input
            style={{
              height: 40,
              padding: '0 12px',
              backgroundColor: D.bg,
              borderRadius: D.radiusM,
              fontSize: D.body,
              marginBottom: 12,
            }}
            value={nickname}
            maxlength={12}
            onInput={(e) => setNickname(e.detail.value)}
            onBlur={() => householdStore.setMemberNickname(nickname)}
            placeholder="爸爸 / 妈妈 / 我"
          />

          {householdStore.inHousehold ? (
            <>
              <View
                style={{
                  padding: 12,
                  backgroundColor: D.accentMuted,
                  borderRadius: D.radiusM,
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: D.caption, color: D.accent }}>邀请码</Text>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: D.weightBold,
                    color: D.label,
                    letterSpacing: 4,
                    marginTop: 4,
                  }}
                >
                  {householdStore.inviteCode}
                </Text>
                <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 6 }}>
                  {householdStore.household?.members?.length ?? 1} 位成员 ·{' '}
                  {householdStore.syncStatus === 'error'
                    ? `同步异常：${householdStore.lastSyncError}`
                    : householdStore.syncStatus === 'syncing'
                    ? '同步中…'
                    : '冰箱与清单已共享'}
                </Text>
              </View>

              <View style={{ display: 'flex', gap: 8 }}>
                <Button
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 999,
                    backgroundColor: D.accent,
                    color: '#fff',
                    fontSize: D.footnote,
                    border: 'none',
                  }}
                  onClick={copyInvite}
                >
                  复制邀请码
                </Button>
                <Button
                  openType="share"
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 999,
                    backgroundColor: D.accentMuted,
                    color: D.accent,
                    fontSize: D.footnote,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => primeHouseholdShare(householdStore.inviteCode)}
                >
                  <View style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AppIcon
                      name="share"
                      size={14}
                      color={D.accent}
                      backgroundColor="transparent"
                      glyphOnly
                    />
                    <Text style={{ fontSize: D.footnote, color: D.accent }}>分享邀请</Text>
                  </View>
                </Button>
              </View>
              <Button
                style={{
                  marginTop: 8,
                  height: 40,
                  borderRadius: 999,
                  backgroundColor: D.bg,
                  color: D.label,
                  fontSize: D.caption,
                  border: `0.5px solid ${D.separator}`,
                }}
                onClick={() => void householdStore.pullRemote()}
              >
                刷新同步
              </Button>
              <Button
                style={{
                  marginTop: 8,
                  height: 40,
                  borderRadius: 999,
                  backgroundColor: 'transparent',
                  color: D.red,
                  fontSize: D.caption,
                  border: 'none',
                }}
                onClick={() => householdStore.leaveHousehold()}
              >
                退出家庭
              </Button>
            </>
          ) : (
            <>
              <Button
                style={{
                  height: 44,
                  borderRadius: 999,
                  backgroundColor: D.accent,
                  color: '#fff',
                  fontSize: D.subheadline,
                  fontWeight: D.weightSemibold,
                  border: 'none',
                  marginBottom: 12,
                }}
                onClick={() => void householdStore.createHousehold()}
              >
                创建家庭厨房
              </Button>
              <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginBottom: 6 }}>
                有邀请码？输入后加入
              </Text>
              <View style={{ display: 'flex', gap: 8 }}>
                <Input
                  style={{
                    flex: 1,
                    height: 40,
                    padding: '0 12px',
                    backgroundColor: D.bg,
                    borderRadius: D.radiusM,
                    fontSize: D.body,
                  }}
                  value={joinCode}
                  maxlength={8}
                  placeholder="6 位邀请码"
                  onInput={(e) => setJoinCode(e.detail.value.toUpperCase())}
                />
                <Button
                  style={{
                    width: 88,
                    height: 40,
                    borderRadius: 999,
                    backgroundColor: D.label,
                    color: D.bgElevated,
                    fontSize: D.footnote,
                    border: 'none',
                  }}
                  onClick={() => void householdStore.joinHousehold(joinCode)}
                >
                  加入
                </Button>
              </View>
            </>
          )}
        </View>
      ) : null}
    </View>
  )
}

export const HouseholdPanel = observer(HouseholdPanelInner)
