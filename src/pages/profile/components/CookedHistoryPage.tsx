import { View, Text, ScrollView } from '@tarojs/components'
import { SubpageHeader } from '../../../components/SubpageHeader'
import { D, mediaRowTextCol } from '../../../theme/designTokens'
import type { Recipe } from '../../../types/recipe'

type CookedRecipe = Recipe & { cookedAt: number }

type Props = {
  items: CookedRecipe[]
  onBack: () => void
  onOpenRecipe: (recipe: CookedRecipe) => void
}

export function CookedHistoryPage({ items, onBack, onOpenRecipe }: Props) {
  return (
    <View style={{ minHeight: '100vh', backgroundColor: D.bg }}>
      <SubpageHeader title="做过的菜" onBack={onBack} />
      <ScrollView scrollY style={{ padding: '16px 22px 40px' }}>
        {items.length === 0 ? (
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: 80,
            }}
          >
            <Text style={{ fontSize: 52, marginBottom: 16 }}>👨‍🍳</Text>
            <Text className="lk-block" style={{ fontSize: D.footnote, color: D.labelTertiary }}>还没有做菜记录，做一道试试</Text>
          </View>
        ) : (
          items.map((item, idx) => (
            <View
              key={idx}
              className="tap-scale"
              style={{
                backgroundColor: D.bgElevated,
                borderRadius: D.radiusM,
                padding: '14px 16px',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                border: `0.5px solid ${D.separatorLight}`,
              }}
              onClick={() => onOpenRecipe(item)}
            >
              <Text style={{ fontSize: 30 }}>{item.emoji || '🥘'}</Text>
              <View style={mediaRowTextCol}>
                <Text style={{ fontSize: D.subheadline, fontWeight: D.weightSemibold, color: D.label }}>
                  {item.title}
                </Text>
                <Text className="lk-block" style={{ fontSize: D.caption, color: D.labelTertiary, marginTop: 3, lineHeight: 1.25 }}>
                  {new Date(item.cookedAt).toLocaleDateString('zh-CN')} 做过
                </Text>
              </View>
              <Text style={{ color: D.labelTertiary }}>›</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}
