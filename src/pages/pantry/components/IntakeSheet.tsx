import { View, Text, Image, Textarea, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { D } from '../../../theme/designTokens'
import { SheetActions } from '../../../components/SheetChrome'
import { slotShortLabel } from '../../../utils/slotLabel'
import { describeExisting } from '../../../utils/duplicateGuard'
import { AppIcon } from '../../../components/AppIcon'
import type { IntakePreviewRow } from '../../../utils/pantryIntake'
import type { IntakeDraft, IntakeScene } from '../../../utils/mediaIntake'

type Props = {
  visible: boolean
  pad: number
  intakeScene: IntakeScene
  intakeDraft: IntakeDraft | null
  visionLoading: boolean
  receiptPreview: IntakePreviewRow[] | null
  receiptText: string
  llmAvailable: boolean
  onReceiptTextChange: (value: string) => void
  onClose: () => void
  onParse: () => void
  onCommit: () => void
  onClearPreview: () => void
  onRerunVision: () => void
}

export function IntakeSheet({
  visible,
  pad,
  intakeScene,
  intakeDraft,
  visionLoading,
  receiptPreview,
  receiptText,
  llmAvailable,
  onReceiptTextChange,
  onClose,
  onParse,
  onCommit,
  onClearPreview,
  onRerunVision,
}: Props) {
  if (!visible) return null

  const title =
    intakeScene === 'receipt'
      ? '小票 / 采购入库'
      : intakeScene === 'ingredients'
        ? '食材识别入库'
        : '待买清单'

  return (
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
      onClick={onClose}
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
        <Text className="lk-title" style={{ fontSize: D.headline, fontWeight: D.weightSemibold, color: D.label }}>
          {title}
        </Text>
        <Text
          className="lk-block"
          style={{
            fontSize: D.footnote,
            color: D.labelSecondary,
            marginTop: 6,
            lineHeight: 1.35,
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
              {llmAvailable && !visionLoading && intakeDraft ? (
                <Text
                  className="tap-scale"
                  style={{ fontSize: D.footnote, color: D.accentDeep, fontWeight: D.weightSemibold }}
                  onClick={onRerunVision}
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
            <AppIcon name="mic" size={18} color={D.accent} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: D.footnote, color: D.label, fontWeight: D.weightSemibold }}>
                语音备忘
              </Text>
              <Text className="lk-block" style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 2, lineHeight: 1.25 }}>
                约 {Math.round((intakeDraft.durationMs ?? 0) / 1000)} 秒 · 边听边写
              </Text>
            </View>
            <Text
              className="tap-scale"
              style={{ fontSize: D.footnote, color: D.accentDeep, fontWeight: D.weightSemibold }}
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
            onInput={(e) => onReceiptTextChange(e.detail.value)}
          />
        ) : null}

        {visionLoading ? (
          <View style={{ marginTop: 24, alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: D.subheadline, color: D.labelSecondary }}>识别中，请稍候…</Text>
          </View>
        ) : null}

        {receiptPreview ? (
          <ScrollView scrollY style={{ maxHeight: 280, marginTop: 14 }}>
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
                <Text className="lk-block" style={{ fontSize: D.caption, color: D.accentDeep, marginTop: 4, lineHeight: 1.25 }}>
                  推荐 {slotShortLabel(row.side, row.slotIndex)}
                </Text>
                {row.duplicateOf.length > 0 ? (
                  <Text
                    className="lk-block"
                    style={{
                      fontSize: D.caption,
                      color: D.orange,
                      marginTop: 4,
                      fontWeight: D.weightMedium,
                      lineHeight: 1.25,
                    }}
                  >
                    ⚠ 冰箱里已有 · {describeExisting(row.duplicateOf[0])}
                  </Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        ) : null}

        <SheetActions
          secondary={
            !receiptPreview
              ? { label: '取消', onClick: onClose }
              : { label: '返回编辑', onClick: onClearPreview }
          }
          primary={
            !receiptPreview
              ? { label: '解析并预览', onClick: onParse }
              : { label: '确认入库', onClick: onCommit }
          }
        />
      </View>
    </View>
  )
}
