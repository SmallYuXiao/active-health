import type {
  AssessmentSubmissionRecord,
  ProgramDefinition,
  TaskCompletionRecord,
} from '../types/health';

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const getDayKey = (date = new Date()) => dayKeyFormatter.format(date);

export const parseDayKey = (dayKey: string) => {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const addDays = (dayKey: string, delta: number) => {
  const date = parseDayKey(dayKey);
  date.setDate(date.getDate() + delta);
  return getDayKey(date);
};

export const formatTimestamp = (isoString?: string) => {
  if (!isoString) {
    return '尚未同步';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString));
};

export const getTaskCompletionForDay = (
  completions: TaskCompletionRecord[],
  taskId: string,
  dayKey: string,
) => completions.find(completion => completion.taskId === taskId && completion.dayKey === dayKey);

export const getProgramTaskProgressForDay = (
  program: ProgramDefinition,
  completions: TaskCompletionRecord[],
  dayKey: string,
) => {
  const completedCount = program.tasks.filter(task =>
    completions.some(
      completion =>
        completion.taskId === task.id &&
        completion.programId === program.id &&
        completion.dayKey === dayKey,
    ),
  ).length;

  return {
    completedCount,
    totalCount: program.tasks.length,
    completionRatio:
      program.tasks.length === 0 ? 0 : completedCount / program.tasks.length,
  };
};

export const computeProgramStreakDays = (
  program: ProgramDefinition,
  completions: TaskCompletionRecord[],
  todayKey = getDayKey(),
) => {
  const completionDays = new Set(
    completions
      .filter(completion => completion.programId === program.id)
      .map(completion => completion.dayKey),
  );

  let streak = 0;
  let cursor = completionDays.has(todayKey) ? todayKey : addDays(todayKey, -1);

  while (completionDays.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
};

export const getLatestAssessmentSubmission = (
  submissions: AssessmentSubmissionRecord[],
  programId: ProgramDefinition['id'],
) =>
  submissions
    .filter(submission => submission.programId === programId)
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))[0];

import type { UserProfile, HealthBaseline, Prescription, ProgramId } from '../types/health';

/**
 * 干预策略接口 (Strategy Pattern)
 */
export interface InterventionStrategy {
  canHandle(condition: ProgramId): boolean;
  generatePrescription(
    profile: UserProfile,
    baseline: HealthBaseline | null
  ): Partial<Prescription>;
}

// 专家策略 A: 下背痛 (LBP)
const LbpStrategy: InterventionStrategy = {
  canHandle: (condition) => condition === 'lbp_msk',
  generatePrescription: (profile, baseline) => {
    const rx: Partial<Prescription> = {
      movement: ['猫牛式拉伸 10 次', '核心稳定：鸟狗式 12 次'],
      behavioral: ['每久坐 45 分钟，务必起身活动 5 分钟'],
    };
    if (baseline?.painLevel && baseline.painLevel > 6) {
      rx.movement = ['平躺仰卧放松休息', '当前阶段避免任何脊柱侧弯及负重动作'];
      rx.medications = ['建议根据医嘱使用非甾体抗炎药', '局部热敷 15-20 分钟缓解肌肉痉挛'];
    }
    return rx;
  }
};

// 专家策略 B: 高血压 (Hypertension - Mock)
const HypertensionStrategy: InterventionStrategy = {
  canHandle: (condition) => condition === 'hypertension',
  generatePrescription: (profile, baseline) => {
    const rx: Partial<Prescription> = {
      nutrition: ['实施低钠饮食 (每日盐摄入量 < 5g)', '增加钾摄入：多吃香蕉、菠菜'],
      movement: ['中等强度有氧：快走或骑车 30 分钟'],
    };
    if (baseline?.bloodPressureSys && baseline.bloodPressureSys >= 160) {
      rx.movement = ['⚠️ 危险：暂停有氧运动，改为静坐冥想或深呼吸'];
      rx.medications = ['按时服用降压药，并在此后 1 小时内复测记录'];
      rx.behavioral = ['立即平躺休息，如伴有剧烈头痛或眩晕请立即呼叫急救'];
    }
    return rx;
  }
};

const strategies = [LbpStrategy, HypertensionStrategy];

/**
 * 核心干预路由引擎
 */
export const generateInterventionPlan = (
  profile: UserProfile,
  baseline: HealthBaseline | null
): Prescription => {
  const finalPrescription: Prescription = {
    nutrition: [],
    movement: [],
    behavioral: [],
    medications: []
  };

  profile.conditions.forEach(condition => {
    const strategy = strategies.find(s => s.canHandle(condition));
    if (strategy) {
      const conditionRx = strategy.generatePrescription(profile, baseline);
      if (conditionRx.nutrition) finalPrescription.nutrition!.push(...conditionRx.nutrition);
      if (conditionRx.movement) finalPrescription.movement!.push(...conditionRx.movement);
      if (conditionRx.behavioral) finalPrescription.behavioral!.push(...conditionRx.behavioral);
      if (conditionRx.medications) finalPrescription.medications!.push(...conditionRx.medications);
    }
  });

  return finalPrescription;
};
