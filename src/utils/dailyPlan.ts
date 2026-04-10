import type {
  AssessmentSubmissionRecord,
  HealthBaseline,
  ProgramDefinition,
  ProgramId,
  TaskCategory,
  TaskCompletionRecord,
  UserProfile,
} from '../types/health';
import { generateInterventionPlan } from './engine';

export type DailyTaskSource = 'core' | 'personalized' | 'safety';

export interface DailyTaskDefinition {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  points: number;
  cadenceLabel: string;
  source: DailyTaskSource;
}

interface BuildDailyTaskPlanInput {
  program: ProgramDefinition;
  userProfile: UserProfile | null;
  healthBaseline: HealthBaseline | null;
  latestAssessment?: AssessmentSubmissionRecord;
  hasRedFlags: boolean;
}

const PERSONALIZED_POINTS = 15;
const SAFETY_POINTS = 20;
const MAX_PERSONALIZED_TASKS = 2;

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }
  return hash.toString(36);
};

const createTaskId = (
  source: DailyTaskSource,
  category: TaskCategory,
  title: string,
  description: string,
) => `${source}_${category}_${hashString(`${title}|${description}`)}`;

const createPersonalizedTask = (
  title: string,
  description: string,
  category: TaskCategory,
  source: DailyTaskSource = 'personalized',
  points: number = PERSONALIZED_POINTS,
): DailyTaskDefinition => ({
  id: createTaskId(source, category, title, description),
  title,
  description,
  category,
  points,
  cadenceLabel: '千人千面 · 今日',
  source,
});

export const buildDailyTaskPlan = ({
  program,
  userProfile,
  healthBaseline,
  latestAssessment,
  hasRedFlags,
}: BuildDailyTaskPlanInput) => {
  const coreTasks: DailyTaskDefinition[] = program.tasks.map(task => ({
    ...task,
    source: 'core',
  }));

  if (!userProfile || !latestAssessment) {
    return { tasks: coreTasks, coreTasks, personalizedTasks: [] as DailyTaskDefinition[] };
  }

  const latestRiskBand = program.assessment.riskBands.find(
    band => band.id === latestAssessment.riskBandId,
  );
  const requiresSafetyMode = hasRedFlags || latestRiskBand?.tone === 'critical';

  const personalizedTasks: DailyTaskDefinition[] = requiresSafetyMode
    ? [
        createPersonalizedTask(
          '记录危险信号变化',
          '关注麻木、无力、排便排尿异常、夜间持续痛等风险信号。',
          'measurement',
          'safety',
          SAFETY_POINTS,
        ),
        createPersonalizedTask(
          '完成一次专业医疗联系',
          '优先线上问诊或线下预约，今天不做高强度训练。',
          'recovery',
          'safety',
          SAFETY_POINTS,
        ),
      ]
    : (() => {
        const prescription = generateInterventionPlan(userProfile, healthBaseline);
        const candidates: DailyTaskDefinition[] = [];

        if (prescription.movement?.[0]) {
          candidates.push(
            createPersonalizedTask(
              prescription.movement[0],
              '按今日状态定制的运动建议，完成后再进入下一项。',
              'movement',
            ),
          );
        }

        if (prescription.behavioral?.[0]) {
          candidates.push(
            createPersonalizedTask(
              prescription.behavioral[0],
              '今天至少执行一次，优先在疼痛容易出现的时段完成。',
              'recovery',
            ),
          );
        }

        if (prescription.nutrition?.[0]) {
          candidates.push(
            createPersonalizedTask(
              prescription.nutrition[0],
              '把它纳入今天的饮食决策，尽量在晚间前完成。',
              'nutrition',
            ),
          );
        }

        if (prescription.medications?.[0]) {
          candidates.push(
            createPersonalizedTask(
              prescription.medications[0],
              '按医嘱执行，如出现加重请及时联系医生。',
              'medication',
            ),
          );
        }

        const uniqueByTitle = candidates.filter(
          (task, index, array) =>
            array.findIndex(candidate => candidate.title === task.title) === index,
        );

        return uniqueByTitle.slice(0, MAX_PERSONALIZED_TASKS);
      })();

  return {
    tasks: [...coreTasks, ...personalizedTasks],
    coreTasks,
    personalizedTasks,
  };
};

export const getDailyTaskProgressForDay = (
  tasks: DailyTaskDefinition[],
  completions: TaskCompletionRecord[],
  programId: ProgramId,
  dayKey: string,
) => {
  const completedTaskIds = new Set(
    completions
      .filter(completion => completion.programId === programId && completion.dayKey === dayKey)
      .map(completion => completion.taskId),
  );

  const completedCount = tasks.filter(task => completedTaskIds.has(task.id)).length;

  return {
    completedCount,
    totalCount: tasks.length,
    completionRatio: tasks.length === 0 ? 0 : completedCount / tasks.length,
  };
};
