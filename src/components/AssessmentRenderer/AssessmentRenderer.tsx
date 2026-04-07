import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import type {
  AssessmentAnswer,
  AssessmentAnswerMap,
  AssessmentQuestion,
} from '../../types/health';
import type { AssessmentStepGroup } from '../../utils/assessment';

interface AssessmentRendererProps {
  groups: AssessmentStepGroup[];
  answers: AssessmentAnswerMap;
  accentColor: string;
  onChangeAnswer: (questionId: string, answer: AssessmentAnswer | undefined) => void;
}

interface ChoiceOptionProps {
  label: string;
  description?: string;
  selected: boolean;
  accentColor: string;
  variant: 'radio' | 'checkbox';
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
}

export const AssessmentRenderer: React.FC<AssessmentRendererProps> = ({
  groups,
  answers,
  accentColor,
  onChangeAnswer,
}) => {
  return (
    <View style={styles.container}>
      {groups.map(group => (
        <View key={group.id} style={styles.groupBlock}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.description ? (
              <Text style={styles.groupDescription}>{group.description}</Text>
            ) : null}
          </View>

          {group.questions.map(question => (
            <View key={question.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <View style={styles.titleRow}>
                  <Text style={styles.questionTitle}>{question.title}</Text>
                  {question.required ? (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredText}>必答</Text>
                    </View>
                  ) : null}
                </View>
                {question.description ? (
                  <Text style={styles.questionDescription}>{question.description}</Text>
                ) : null}
                {question.helperText ? (
                  <Text style={styles.helperText}>{question.helperText}</Text>
                ) : null}
              </View>

              {renderQuestionInput(question, answers, accentColor, onChangeAnswer)}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const ChoiceOption: React.FC<ChoiceOptionProps> = ({
  label,
  description,
  selected,
  accentColor,
  variant,
  compact = false,
  style,
  onPress,
}) => {
  const optionSelectedStyle: StyleProp<ViewStyle> | undefined = selected
    ? {
        borderColor: accentColor,
        backgroundColor: `${accentColor}12`,
      }
    : undefined;
  const indicatorSelectedStyle: StyleProp<ViewStyle> | undefined = selected
    ? {
        borderColor: accentColor,
        backgroundColor: variant === 'checkbox' ? accentColor : '#FFFFFF',
      }
    : undefined;
  const optionLabelSelectedStyle = selected ? { color: accentColor } : undefined;
  const innerIndicatorColor =
    variant === 'checkbox' ? '#FFFFFF' : accentColor;
  const innerIndicatorStyle = { backgroundColor: innerIndicatorColor };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        compact && styles.compactOptionCard,
        optionSelectedStyle,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View
        style={[
          variant === 'radio' ? styles.radioOuter : styles.checkboxOuter,
          indicatorSelectedStyle,
        ]}
      >
        {selected ? (
          <View
            style={[
              variant === 'radio' ? styles.radioInner : styles.checkboxInner,
              variant === 'checkbox' && styles.checkboxInnerSelected,
              innerIndicatorStyle,
            ]}
          />
        ) : null}
      </View>
      <View style={styles.optionCopy}>
        <Text style={[styles.optionLabel, optionLabelSelectedStyle]}>
          {label}
        </Text>
        {description ? (
          <Text style={styles.optionDescription}>{description}</Text>
        ) : null}
      </View>
    </Pressable>
  );
};

const renderQuestionInput = (
  question: AssessmentQuestion,
  answers: AssessmentAnswerMap,
  accentColor: string,
  onChangeAnswer: (questionId: string, answer: AssessmentAnswer | undefined) => void,
) => {
  const answer = answers[question.id];

  switch (question.type) {
    case 'boolean':
      return (
        <View style={styles.binaryRow}>
          <ChoiceOption
            label={question.trueLabel ?? '是'}
            selected={answer === true}
            accentColor={accentColor}
            variant="radio"
            style={styles.binaryOption}
            onPress={() => onChangeAnswer(question.id, true)}
          />
          <ChoiceOption
            label={question.falseLabel ?? '否'}
            selected={answer === false}
            accentColor={accentColor}
            variant="radio"
            style={styles.binaryOption}
            onPress={() => onChangeAnswer(question.id, false)}
          />
        </View>
      );
    case 'single_select':
      return (
        <View style={styles.optionGrid}>
          {question.options.map(option => (
            <ChoiceOption
              key={option.id}
              label={option.label}
              description={option.description}
              selected={answer === option.value}
              accentColor={accentColor}
              variant="radio"
              style={
                question.options.length <= 2 ? styles.binaryOption : styles.gridOption
              }
              onPress={() => onChangeAnswer(question.id, option.value)}
            />
          ))}
        </View>
      );
    case 'multi_select': {
      const selectedAnswers = Array.isArray(answer) ? answer : [];

      return (
        <View style={styles.multiSelectList}>
          {question.options.map(option => {
            const isSelected = selectedAnswers.includes(option.value);
            return (
              <ChoiceOption
                key={option.id}
                label={option.label}
                description={option.description}
                selected={isSelected}
                accentColor={accentColor}
                variant="checkbox"
                style={styles.fullWidthOption}
                onPress={() => {
                  let nextAnswer: string[];

                  if (option.value === 'none') {
                    nextAnswer = isSelected ? [] : ['none'];
                  } else if (isSelected) {
                    nextAnswer = selectedAnswers.filter(value => value !== option.value);
                  } else {
                    nextAnswer = [
                      ...selectedAnswers.filter(value => value !== 'none'),
                      option.value,
                    ];
                  }

                  onChangeAnswer(
                    question.id,
                    nextAnswer.length === 0 ? undefined : nextAnswer,
                  );
                }}
              />
            );
          })}
        </View>
      );
    }
    case 'scale': {
      const values = Array.from(
        { length: question.max - question.min + 1 },
        (_, index) => question.min + index,
      );

      return (
        <View>
          <View style={styles.scaleLegend}>
            <Text style={styles.scaleLegendText}>
              {question.minLabel ?? question.min}
            </Text>
            <Text style={styles.scaleLegendText}>
              {question.maxLabel ?? question.max}
            </Text>
          </View>
          <View style={styles.optionGrid}>
            {values.map(value => (
              <ChoiceOption
                key={value}
                label={String(value)}
                selected={answer === value}
                accentColor={accentColor}
                variant="radio"
                compact
                style={styles.scaleOption}
                onPress={() => onChangeAnswer(question.id, value)}
              />
            ))}
          </View>
        </View>
      );
    }
    case 'number':
      return (
        <View style={styles.inputWrap}>
          <TextInput
            keyboardType="numeric"
            placeholder={question.placeholder ?? '请输入数值'}
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={answer === undefined ? '' : String(answer)}
            onChangeText={text => {
              if (text.trim().length === 0) {
                onChangeAnswer(question.id, undefined);
                return;
              }

              const parsed = Number(text);
              onChangeAnswer(question.id, Number.isNaN(parsed) ? text : parsed);
            }}
          />
          {question.unit ? <Text style={styles.unitText}>{question.unit}</Text> : null}
        </View>
      );
    case 'text':
      return (
        <TextInput
          multiline
          placeholder={question.placeholder ?? '请输入内容'}
          placeholderTextColor="#9CA3AF"
          style={[styles.input, styles.textArea]}
          value={typeof answer === 'string' ? answer : ''}
          onChangeText={text =>
            onChangeAnswer(question.id, text.trim().length === 0 ? undefined : text)
          }
        />
      );
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  groupBlock: {
    gap: 12,
  },
  groupHeader: {
    gap: 4,
    paddingHorizontal: 2,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  groupDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#94A3B8',
  },
  questionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 14,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 14,
    elevation: 1,
  },
  questionHeader: {
    gap: 6,
  },
  titleRow: {
    gap: 8,
  },
  questionTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
    color: '#18181B',
  },
  requiredBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  requiredText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E11D48',
  },
  questionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#52525B',
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#71717A',
  },
  binaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  multiSelectList: {
    gap: 10,
  },
  optionCard: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactOptionCard: {
    minHeight: 48,
    justifyContent: 'center',
  },
  binaryOption: {
    flex: 1,
  },
  gridOption: {
    width: '48%',
  },
  fullWidthOption: {
    width: '100%',
  },
  scaleOption: {
    width: 68,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#C4C4CC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C4C4CC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  checkboxInnerSelected: {
    width: 9,
    height: 9,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
  },
  scaleLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scaleLegendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
  },
  inputWrap: {
    gap: 8,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    minHeight: 112,
    textAlignVertical: 'top',
  },
  unitText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717A',
  },
  pressed: {
    opacity: 0.9,
  },
});
