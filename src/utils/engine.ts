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
