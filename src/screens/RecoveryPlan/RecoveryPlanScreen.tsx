import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'RecoveryPlan'>;

export const RecoveryPlanScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← 返回</Text>
        </Pressable>
        <Text style={styles.headerTitle}>恢复操作手册</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.introBlock}>
          <Text style={styles.introText}>
            基于今天的身体状态，我们挑选了最保守但有效的干预方案。
          </Text>
        </View>

        {/* First section: Do first today */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. 今明两天 重点先做</Text>
          </View>
          
          <ActionCard 
            title="热敷与缓慢呼吸"
            why="疼痛会引起肌肉不自觉的防御性痉挛。热敷15分钟结合深度腹式呼吸，能有效降低神经系统的紧张感，是所有活动的基石。"
            items={['在最酸痛处铺上热毛巾或热水袋 15-20 分钟', '吸气 4 秒，呼气 6 秒，做 5 个循环']}
          />
          <ActionCard 
            title="把久坐拆碎"
            why="长时间维持同一个静态姿势会让损伤处的血液循环变差。频繁改变姿势比完美的坐姿更重要。"
            items={['不用刻意挺直腰板', '每坐或躺 40 分钟，必须起身走动 2 分钟再回来']}
          />
        </View>

        {/* Second section: Continue activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>2. 推荐的温和活动</Text>
          </View>
          
          <ActionCard 
            title="间歇性慢走"
            why="轻度活动比完全卧床更有助于下背部功能恢复。步行的轻微震荡能给予椎间盘适当的营养交换。"
            items={['在平地上慢走 8-10 分钟', '如果在行走中疼痛加剧，缩短单次时间，增加频次']}
          />
        </View>

        {/* Third section: Emergency Mode */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, styles.emergencyHeader]}>
            <Text style={styles.sectionTitle}>🚑 急救模式：如果今天特别疼</Text>
          </View>
          
          <View style={[styles.card, styles.emergencyCard]}>
            <Text style={styles.emergencyText}>当您的疼痛呈现不可控的爆发时，请采用紧急退阶策略：</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• 停止所有拉伸和步行任务。</Text>
              <Text style={styles.bulletItem}>• 寻找最舒服的姿势（如平躺并在膝盖下垫枕头）休息。</Text>
              <Text style={styles.bulletItem}>• 第一时间的缓解优先级是：热敷或冷敷（以你觉得最舒服为准）。</Text>
              <Text style={styles.bulletItem}>• 如果伴随腿部麻木等严重症状，点击下方按钮：</Text>
            </View>
            <Pressable 
               style={styles.redFlagButton}
               onPress={() => navigation.navigate('RedFlagAlert')}
            >
               <Text style={styles.redFlagButtonText}>查看高风险说明</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const ActionCard = ({ title, why, items }: { title: string, why: string, items: string[] }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    <View style={styles.whyBox}>
      <Text style={styles.whyLabel}>为什么这么做？</Text>
      <Text style={styles.whyText}>{why}</Text>
    </View>
    <View style={styles.bulletList}>
      {items.map((item, index) => (
        <Text key={index} style={styles.bulletItem}>• {item}</Text>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#0F766E',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1917',
  },
  headerSpacer: {
    width: 60,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
    gap: 28,
  },
  introBlock: {
    paddingVertical: 4,
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F766E',
  },
  whyBox: {
    backgroundColor: '#F5F5F4',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  whyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78716C',
  },
  whyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
  bulletList: {
    gap: 8,
    marginTop: 4,
  },
  bulletItem: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    paddingLeft: 4,
  },
  emergencyHeader: {
    marginTop: 8,
  },
  emergencyCard: {
    backgroundColor: '#FFF1F2', // Light Rose
    borderColor: '#FECDD3',
  },
  emergencyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9F1239', // Rose 800
    lineHeight: 22,
  },
  redFlagButton: {
    marginTop: 12,
    backgroundColor: '#BE123C', // Rose 700
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  redFlagButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
