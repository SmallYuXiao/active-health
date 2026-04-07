import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useHealthEngineStore, getProgramSnapshot } from '../../store/useHealthEngineStore';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentResult'>;

export const AssessmentResultScreen: React.FC<Props> = ({ navigation }) => {
  const activeProgramId = useHealthEngineStore(state => state.activeProgramId);
  const totalPoints = useHealthEngineStore(state => state.totalPoints);
  const taskCompletions = useHealthEngineStore(state => state.taskCompletions);
  const assessmentSubmissions = useHealthEngineStore(state => state.assessmentSubmissions);
  const queueJobs = useHealthEngineStore(state => state.queueJobs);

  const snapshot = getProgramSnapshot(
    {
      activeProgramId,
      totalPoints,
      taskCompletions,
      assessmentSubmissions,
      queueJobs,
    },
    activeProgramId,
  );

  const latestRiskBand = snapshot.latestAssessment
    ? snapshot.program.assessment.riskBands.find(
        band => band.id === snapshot.latestAssessment?.riskBandId,
      )
    : undefined;

  // Placeholder logic based on tone (positive, warning, critical should go to red flag ideally)
  const isSelfManageable = latestRiskBand?.tone === 'positive' || latestRiskBand?.tone === 'warning';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.eyebrow}>评估完成</Text>
        <Text style={styles.title}>
          {isSelfManageable ? '当前状态适合自我管理' : '建议采取更保守的恢复策略'}
        </Text>

        <Text style={styles.summaryText}>
          {latestRiskBand?.summary || '根据您的反馈，我们为您生成了当天的恢复建议。'}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ 今天建议做的事</Text>
          <View style={styles.card}>
            <Text style={styles.listItem}>• 保持每小时起身走动 2 分钟，避免久坐僵化。</Text>
            <Text style={styles.listItem}>• 进行 1-2 次我们推荐的温和腰部放松与呼吸。</Text>
            <Text style={styles.listItem}>• 维持正常的轻度日常活动，这比完全卧床更有利于恢复。</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⛔️ 今天先不要做</Text>
          <View style={[styles.card, styles.warningCard]}>
            <Text style={styles.listItem}>• 避免搬运重物，特别是需要弯腰扭转躯干的动作。</Text>
            <Text style={styles.listItem}>• 避免进行高强度的核心训练或拉伸到产生剧痛的程度。</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>复查建议</Text>
          <View style={styles.card}>
            <Text style={styles.normalText}>如果明天感觉疼痛明显加重，或者出现了腿部麻木等新症状，请务必再次填写评估或直接就医。</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.primaryButtonText}>开始今天的恢复计划</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Off-white
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 24,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '800',
    color: '#65A30D', // Olive Green
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1917',
    lineHeight: 34,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  warningCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCCCA7',
  },
  listItem: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  normalText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: '#FAF9F6',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    backgroundColor: '#C2410C', // Terracotta Orange
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
