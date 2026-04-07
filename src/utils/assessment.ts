import type {
  AssessmentAnswer,
  AssessmentAnswerMap,
  AssessmentQuestion,
  AssessmentSchema,
  AssessmentSection,
  PrimitiveAnswer,
  RuleOperator,
  ScoreRule,
} from '../types/health';

export interface AssessmentStepGroup {
  id: string;
  title: string;
  description?: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentStep {
  id: string;
  groups: AssessmentStepGroup[];
  questions: AssessmentQuestion[];
}

const asNumber = (value: AssessmentAnswer | PrimitiveAnswer | string[]) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
};

export const evaluateAnswerRule = (
  answer: AssessmentAnswer | undefined,
  operator: RuleOperator,
  expected: PrimitiveAnswer | string[],
) => {
  if (answer === undefined) {
    return false;
  }

  if (operator === 'includes') {
    if (Array.isArray(answer)) {
      if (Array.isArray(expected)) {
        return expected.every(item => answer.includes(String(item)));
      }

      return answer.includes(String(expected));
    }

    return String(answer).includes(String(expected));
  }

  if (operator === 'equals') {
    return answer === expected;
  }

  if (operator === 'not_equals') {
    return answer !== expected;
  }

  const left = asNumber(answer);
  const right = asNumber(expected);

  if (left === undefined || right === undefined) {
    return false;
  }

  switch (operator) {
    case 'greater_than':
      return left > right;
    case 'greater_than_or_equal':
      return left >= right;
    case 'less_than':
      return left < right;
    case 'less_than_or_equal':
      return left <= right;
    default:
      return false;
  }
};

export const isQuestionVisible = (
  question: AssessmentQuestion,
  answers: AssessmentAnswerMap,
) => {
  if (!question.visibleWhen || question.visibleWhen.length === 0) {
    return true;
  }

  return question.visibleWhen.every(rule => {
    const answer = answers[rule.questionId];
    return evaluateAnswerRule(answer, rule.operator, rule.value);
  });
};

export const getVisibleQuestions = (
  schema: AssessmentSchema,
  answers: AssessmentAnswerMap,
) =>
  schema.sections.flatMap(section =>
    section.questions.filter(question => isQuestionVisible(question, answers)),
  );

export const getVisibleSections = (
  schema: AssessmentSchema,
  answers: AssessmentAnswerMap,
) =>
  schema.sections
    .map(section => ({
      ...section,
      questions: section.questions.filter(question => isQuestionVisible(question, answers)),
    }))
    .filter(section => section.questions.length > 0);

export const isQuestionAnswered = (
  question: AssessmentQuestion,
  answers: AssessmentAnswerMap,
) => {
  const answer = answers[question.id];

  if (answer === undefined) {
    return false;
  }

  if (Array.isArray(answer)) {
    return answer.length > 0;
  }

  if (typeof answer === 'string') {
    return answer.trim().length > 0;
  }

  return true;
};

export const getAssessmentCompletion = (
  schema: AssessmentSchema,
  answers: AssessmentAnswerMap,
) => {
  const visibleQuestions = getVisibleQuestions(schema, answers);
  const requiredQuestions = visibleQuestions.filter(question => question.required);
  const answeredRequiredCount = requiredQuestions.filter(question =>
    isQuestionAnswered(question, answers),
  ).length;

  return {
    visibleQuestions,
    requiredQuestions,
    answeredRequiredCount,
    completionRatio:
      requiredQuestions.length === 0
        ? 1
        : answeredRequiredCount / requiredQuestions.length,
    isComplete: answeredRequiredCount === requiredQuestions.length,
  };
};

const getOptionScore = (question: AssessmentQuestion, answer: AssessmentAnswer | undefined) => {
  if (answer === undefined) {
    return 0;
  }

  if (question.type === 'single_select') {
    const option = question.options.find(item => item.value === answer);
    return option?.score ?? 0;
  }

  if (question.type === 'multi_select' && Array.isArray(answer)) {
    return answer.reduce((total, selected) => {
      const option = question.options.find(item => item.value === selected);
      return total + (option?.score ?? 0);
    }, 0);
  }

  return 0;
};

const getRuleScore = (answer: AssessmentAnswer | undefined, rules?: ScoreRule[]) => {
  if (answer === undefined || !rules || rules.length === 0) {
    return 0;
  }

  return rules.reduce((total, rule) => {
    return total + (evaluateAnswerRule(answer, rule.operator, rule.value) ? rule.score : 0);
  }, 0);
};

export const getQuestionScore = (
  question: AssessmentQuestion,
  answers: AssessmentAnswerMap,
) => {
  const answer = answers[question.id];

  return getOptionScore(question, answer) + getRuleScore(answer, question.scoreRules);
};

export const calculateAssessmentScore = (
  schema: AssessmentSchema,
  answers: AssessmentAnswerMap,
) => {
  const visibleQuestions = getVisibleQuestions(schema, answers);

  return visibleQuestions.reduce((total, question) => {
    return total + getQuestionScore(question, answers);
  }, 0);
};

export const resolveRiskBand = (schema: AssessmentSchema, score: number) => {
  const sortedBands = [...schema.riskBands].sort((left, right) => right.minScore - left.minScore);
  return (
    sortedBands.find(band => score >= band.minScore) ??
    sortedBands[sortedBands.length - 1]
  );
};

export const buildAssessmentPayload = (
  schema: AssessmentSchema,
  answers: AssessmentAnswerMap,
) => {
  const visibleQuestions = getVisibleQuestions(schema, answers);
  const visibleQuestionIds = visibleQuestions.map(question => question.id);
  const payload = Object.fromEntries(
    visibleQuestionIds
      .filter(questionId => answers[questionId] !== undefined)
      .map(questionId => [questionId, answers[questionId]]),
  ) as AssessmentAnswerMap;

  return { payload, visibleQuestionIds };
};

export const flattenQuestions = (sections: AssessmentSection[]) =>
  sections.flatMap(section => section.questions);

export const buildAssessmentSteps = (
  schema: AssessmentSchema,
  answers: AssessmentAnswerMap,
  pageSize = 3,
) => {
  const visibleSections = getVisibleSections(schema, answers);
  const steps: AssessmentStep[] = [];

  let currentGroups: AssessmentStepGroup[] = [];
  let currentQuestions: AssessmentQuestion[] = [];

  const pushStep = () => {
    if (currentQuestions.length === 0) {
      return;
    }

    steps.push({
      id: `step_${steps.length + 1}`,
      groups: currentGroups,
      questions: currentQuestions,
    });

    currentGroups = [];
    currentQuestions = [];
  };

  visibleSections.forEach(section => {
    section.questions.forEach(question => {
      if (currentQuestions.length >= pageSize) {
        pushStep();
      }

      const lastGroup = currentGroups[currentGroups.length - 1];

      if (lastGroup && lastGroup.id === section.id) {
        lastGroup.questions.push(question);
      } else {
        currentGroups.push({
          id: section.id,
          title: section.title,
          description: section.description,
          questions: [question],
        });
      }

      currentQuestions.push(question);
    });
  });

  pushStep();

  return steps;
};
