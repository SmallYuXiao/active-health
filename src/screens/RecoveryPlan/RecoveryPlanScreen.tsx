import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useHealthEngineStore } from '../../store/useHealthEngineStore';
import { generateInterventionPlan } from '../../utils/engine';

type Props = NativeStackScreenProps<RootStackParamList, 'RecoveryPlan'>;

export const RecoveryPlanScreen: React.FC<Props> = ({ navigation }) => {
  const { userProfile, healthBaseline } = useHealthEngineStore();
  
  if (!userProfile) return null;

  const prescription = generateInterventionPlan(userProfile, healthBaseline);

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
            基于您每天身体录入的状态，数字干预引擎为您生成了以下即时方案。
          </Text>
        </View>

        {prescription.medications && prescription.medications.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, styles.emergencyHeader]}>
              <Text style={styles.sectionTitle}>🚨 急诊与药物指导</Text>
            </View>
            <ActionCard 
              title="请优先执行"
              why="系统监测到您的体征反馈已触发保护阈值，必须优先采纳医疗动作。"
              items={prescription.medications}
            />
          </View>
        )}

        {prescription.movement && prescription.movement.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏃‍♂️ 运动处方</Text>
            </View>
            <ActionCard 
              title="当前最适宜的躯体动作"
              why="由引擎结合您的评估基线、主控疾病种类所下发的专科指导。"
              items={prescription.movement}
            />
          </View>
        )}

        {prescription.behavioral && prescription.behavioral.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💡 行为矫正</Text>
            </View>
            <ActionCard 
              title="日常习惯调整"
              why="切断长期致病因子的关键，在于生活微小的姿势改变。"
              items={prescription.behavioral}
            />
          </View>
        )}

        {prescription.nutrition && prescription.nutrition.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🥗 营养建议</Text>
            </View>
            <ActionCard 
              title="膳食管理"
              why="良好的饮食是降低全身炎症反应与代谢风险的重要基石。"
              items={prescription.nutrition}
            />
          </View>
        )}

        {prescription.medications && prescription.medications.length > 0 && (
          <View style={[styles.card, styles.emergencyCard, { marginTop: 12 }]}>
            <Text style={styles.emergencyText}>当前处于系统告警退阶状态，如果伴有其他并发严重症状，切勿拖延，请立即联系医生介入：</Text>
            <Pressable 
               style={styles.redFlagButton}
               onPress={() => navigation.navigate('Telemed')}
            >
               <Text style={styles.redFlagButtonText}>马上发起图文问诊</Text>
            </Pressable>
          </View>
        )}

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
