import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useShallow } from 'zustand/react/shallow';
import { AssessmentRenderer } from '../../components/AssessmentRenderer';
import { getProgramById } from '../../data/programCatalog';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useHealthEngineStore } from '../../store/useHealthEngineStore';
import type { AssessmentAnswer, AssessmentAnswerMap } from '../../types/health';
import {
  buildAssessmentSteps,
  calculateAssessmentScore,
  getAssessmentCompletion,
  isQuestionAnswered,
  resolveRiskBand,
} from '../../utils/assessment';
import { formatTimestamp } from '../../utils/engine';

type AssessmentScreenProps = NativeStackScreenProps<RootStackParamList, 'Assessment'>;

const QUESTIONS_PER_STEP = 3;

type AssessmentFlowStep =
  | { type: 'consent' }
  | {
      type: 'questions';
      id: string;
      groups: ReturnType<typeof buildAssessmentSteps>[number]['groups'];
      questions: ReturnType<typeof buildAssessmentSteps>[number]['questions'];
    };

export const AssessmentScreen: React.FC<AssessmentScreenProps> = ({ navigation }) => {
  const { activeProgramId, latestAssessment, submitAssessment } = useHealthEngineStore(
    useShallow(state => {
      return {
        activeProgramId: state.activeProgramId,
        latestAssessment: state.assessmentSubmissions
          .filter(submission => submission.programId === state.activeProgramId)
          .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))[0],
        submitAssessment: state.submitAssessment,
      };
    }),
  );
  const currentProgramDefinition = getProgramById(activeProgramId);
  const scrollViewRef = useRef<ScrollView>(null);

  const [answers, setAnswers] = useState<AssessmentAnswerMap>(
    latestAssessment?.answers ?? {},
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    setAnswers(latestAssessment?.answers ?? {});
    setCurrentStepIndex(0);
  }, [activeProgramId, latestAssessment?.answers, latestAssessment?.id]);

  const completion = getAssessmentCompletion(
    currentProgramDefinition.assessment,
    answers,
  );
  const score = calculateAssessmentScore(currentProgramDefinition.assessment, answers);
  const previewRiskBand = resolveRiskBand(currentProgramDefinition.assessment, score);
  const questionSteps = buildAssessmentSteps(
    currentProgramDefinition.assessment,
    answers,
    QUESTIONS_PER_STEP,
  );
  const flowSteps: AssessmentFlowStep[] = [
    ...(currentProgramDefinition.assessmentConsent ? [{ type: 'consent' as const }] : []),
    ...questionSteps.map(step => ({
      type: 'questions' as const,
      id: step.id,
      groups: step.groups,
      questions: step.questions,
    })),
  ];
  const totalSteps = flowSteps.length || 1;
  const safeStepIndex = Math.min(currentStepIndex, totalSteps - 1);
  const currentStep = flowSteps[safeStepIndex];
  const isConsentStep = currentStep?.type === 'consent';
  const currentQuestionStep = currentStep?.type === 'questions' ? currentStep : undefined;
  const isLastStep = safeStepIndex === totalSteps - 1;
  const currentStepRequiredCount =
    currentQuestionStep?.questions.filter(question => question.required).length ?? 0;
  const currentStepAnsweredRequiredCount =
    currentQuestionStep?.questions.filter(
      question => question.required && isQuestionAnswered(question, answers),
    ).length ?? 0;

  useEffect(() => {
    if (currentStepIndex > totalSteps - 1) {
      setCurrentStepIndex(Math.max(totalSteps - 1, 0));
    }
  }, [currentStepIndex, totalSteps]);

  const handleChangeAnswer = (
    questionId: string,
    answer: AssessmentAnswer | undefined,
  ) => {
    setAnswers(currentAnswers => {
      const nextAnswers = { ...currentAnswers };

      if (answer === undefined) {
        delete nextAnswers[questionId];
      } else {
        nextAnswers[questionId] = answer;
      }

      return nextAnswers;
    });
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleBack = () => {
    if (safeStepIndex > 0) {
      setCurrentStepIndex(previous => previous - 1);
      requestAnimationFrame(scrollToTop);
      return;
    }

    navigation.goBack();
  };

  const handleSubmit = () => {
    const result = submitAssessment(answers, activeProgramId);

    if (!result.ok) {
      Alert.alert('评估未完成', '请先完成当前可见的必答题，再提交。');
      return;
    }

    Alert.alert('评估已保存', previewRiskBand.summary, [
      {
        text: '查看今日方案',
        onPress: () => navigation.navigate('AssessmentResult'),
      },
      { text: '留在当前页', style: 'cancel' },
    ]);
  };

  const handleNext = () => {
    if (isConsentStep) {
      setCurrentStepIndex(previous => previous + 1);
      requestAnimationFrame(scrollToTop);
      return;
    }

    const currentStepMissingRequired =
      currentQuestionStep?.questions.filter(
        question => question.required && !isQuestionAnswered(question, answers),
      ) ?? [];

    if (currentStepMissingRequired.length > 0) {
      Alert.alert('当前页未完成', '请先完成本页所有必答题。');
      return;
    }

    const gate = currentProgramDefinition.assessmentGate;
    const isGateStep =
      gate &&
      currentQuestionStep?.questions.some(question => question.id === gate.questionId);

    if (gate && isGateStep) {
      const gateAnswer = answers[gate.questionId];
      const hasBlockingValue =
        Array.isArray(gateAnswer) &&
        gate.blockingValues.some(value => gateAnswer.includes(value));

      if (hasBlockingValue) {
        Alert.alert(gate.title, gate.message);
        return;
      }
    }

    if (isLastStep) {
      handleSubmit();
      return;
    }

    setCurrentStepIndex(previous => previous + 1);
    requestAnimationFrame(scrollToTop);
  };

  const isNextDisabled = !isConsentStep && currentStepAnsweredRequiredCount < currentStepRequiredCount;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>{safeStepIndex > 0 ? '‹' : '×'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>自我评估</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((safeStepIndex + 1) / totalSteps) * 100}%`,
                  backgroundColor: currentProgramDefinition.accentColor,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            第 {safeStepIndex + 1} / {totalSteps} 步
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introBlock}>
            <Text style={styles.eyebrow}>{currentProgramDefinition.title}</Text>
            <Text style={styles.screenTitle}>
              {isConsentStep && currentProgramDefinition.assessmentConsent
                ? currentProgramDefinition.assessmentConsent.title
                : currentProgramDefinition.assessment.title}
            </Text>
            <Text style={styles.screenSubtitle}>
              {isConsentStep && currentProgramDefinition.assessmentConsent
                ? '开始正式评估前，请先确认知情同意。'
                : currentProgramDefinition.assessment.description}
            </Text>
          </View>

          {isConsentStep && currentProgramDefinition.assessmentConsent ? (
            <View style={styles.consentCard}>
              <View
                style={[
                  styles.consentBadge,
                  { backgroundColor: currentProgramDefinition.accentSurface },
                ]}
              >
                <Text
                  style={[
                    styles.consentBadgeIcon,
                    { color: currentProgramDefinition.accentColor },
                  ]}
                >
                  ✓
                </Text>
              </View>
              <Text style={styles.consentTitle}>
                {currentProgramDefinition.assessmentConsent.title}
              </Text>
              <Text style={styles.consentBody}>
                {currentProgramDefinition.assessmentConsent.body}
              </Text>
              {currentProgramDefinition.assessmentConsent.footnote ? (
                <Text style={styles.consentFootnote}>
                  {currentProgramDefinition.assessmentConsent.footnote}
                </Text>
              ) : null}
            </View>
          ) : null}

          {currentQuestionStep ? (
            <AssessmentRenderer
              groups={currentQuestionStep.groups}
              answers={answers}
              accentColor={currentProgramDefinition.accentColor}
              onChangeAnswer={handleChangeAnswer}
            />
          ) : null}

          {isLastStep && currentQuestionStep ? (
            <View style={styles.summaryPanel}>
              <View style={styles.summaryTile}>
                <Text style={styles.summaryTileLabel}>当前得分</Text>
                <Text style={styles.summaryTileValue}>{score}</Text>
              </View>
              <View style={styles.summaryTile}>
                <Text style={styles.summaryTileLabel}>风险预览</Text>
                <Text style={styles.summaryTileValue}>{previewRiskBand.label}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.noteBlock}>
            {!isConsentStep ? (
              <Text style={styles.noteText}>
                必答进度：{completion.answeredRequiredCount}/
                {completion.requiredQuestions.length || 0}
              </Text>
            ) : null}
            {!isConsentStep && currentStepRequiredCount > 0 ? (
              <Text style={styles.noteText}>
                本页必答：{currentStepAnsweredRequiredCount}/{currentStepRequiredCount}
              </Text>
            ) : null}
            <Text style={styles.noteText}>
              上次保存：{formatTimestamp(latestAssessment?.submittedAt)}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={isNextDisabled ? undefined : handleNext}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: isNextDisabled ? '#E5E7EB' : currentProgramDefinition.accentColor },
              pressed && !isNextDisabled && styles.pressedButton,
            ]}
          >
            <Text style={[
              styles.primaryButtonText,
              isNextDisabled && { color: '#9CA3AF' } // Gray text if disabled
            ]}>
              {isConsentStep && currentProgramDefinition.assessmentConsent
                ? currentProgramDefinition.assessmentConsent.acceptLabel
                : isNextDisabled
                  ? `向下滑动，完成本页必答题 (${currentStepAnsweredRequiredCount}/${currentStepRequiredCount})`
                  : isLastStep
                    ? currentProgramDefinition.assessment.submitLabel
                    : '下一步'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: '#374151',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  headerSpacer: {
    width: 36,
  },
  progressBlock: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // 增加巨大的下方留白，让用户能把内容推上来
    gap: 18,
  },
  introBlock: {
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E11D48',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  screenTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#111827',
  },
  screenSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  consentCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  consentBadge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentBadgeIcon: {
    fontSize: 44,
    fontWeight: '800',
  },
  consentTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  consentBody: {
    fontSize: 15,
    lineHeight: 23,
    color: '#4B5563',
    textAlign: 'center',
  },
  consentFootnote: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
  summaryPanel: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryTile: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 8,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  summaryTileLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  summaryTileValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  noteBlock: {
    gap: 4,
    paddingHorizontal: 2,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#BE123C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pressedButton: {
    opacity: 0.9,
  },
});
