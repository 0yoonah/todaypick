export const DEFAULT_READING_GOAL = 3;
export const MIN_READING_GOAL = 1;
export const MAX_READING_GOAL = 20;

export const isValidReadingGoal = (value: unknown): value is number =>
  Number.isInteger(value) &&
  Number(value) >= MIN_READING_GOAL &&
  Number(value) <= MAX_READING_GOAL;

export const resolveReadingGoal = (
  activityGoal: unknown,
  userGoal: unknown
): number => {
  if (isValidReadingGoal(activityGoal)) return activityGoal;
  if (isValidReadingGoal(userGoal)) return userGoal;
  return DEFAULT_READING_GOAL;
};

export const getReadingGoalProgress = (readCount: number, goal: number) => {
  const safeGoal = isValidReadingGoal(goal) ? goal : DEFAULT_READING_GOAL;
  const safeReadCount = Math.max(0, Math.floor(readCount));

  return {
    isComplete: safeReadCount >= safeGoal,
    remaining: Math.max(safeGoal - safeReadCount, 0),
    percentage: Math.min((safeReadCount / safeGoal) * 100, 100),
  };
};
