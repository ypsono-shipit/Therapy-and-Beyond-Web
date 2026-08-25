import type { CheckIn } from '../types';

export type CadenceHint = 'struggling' | 'stable' | 'daily';
export type TrendDirection = 'up' | 'down' | 'steady';

function dayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, n: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + n);
  return next;
}

export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Monday 00:00 local time for the week containing `date`. */
export function startOfWeekMonday(date: Date): Date {
  const start = dayStart(date);
  const dow = start.getDay();
  const offset = dow === 0 ? 6 : dow - 1;
  return addDays(start, -offset);
}

function uniqueDaysInRange(checkIns: CheckIn[], start: Date, endExclusive: Date): number {
  const keys = new Set<string>();
  for (const c of checkIns) {
    const t = new Date(c.timestamp);
    if (t >= start && t < endExclusive) keys.add(localDateKey(t));
  }
  return keys.size;
}

/** Unique local calendar dates with a check-in in the current Mon–Sun week. */
export function daysLoggedThisWeek(checkIns: CheckIn[] | undefined, now = new Date()): number {
  const start = startOfWeekMonday(now);
  return uniqueDaysInRange(checkIns ?? [], start, addDays(start, 7));
}

export function weeklyConsistencyPercent(checkIns: CheckIn[] | undefined, now = new Date()): number {
  return (daysLoggedThisWeek(checkIns, now) / 7) * 100;
}

/**
 * Consecutive Mon–Sun weeks with ≥4 unique days logged.
 * The in-progress current week is skipped (not a break) until it reaches 4 days.
 */
export function flexibleStreakWeeks(checkIns: CheckIn[] | undefined, now = new Date()): number {
  const list = checkIns ?? [];
  if (!list.length) return 0;

  let weekStart = startOfWeekMonday(now);
  if (uniqueDaysInRange(list, weekStart, addDays(weekStart, 7)) < 4) {
    weekStart = addDays(weekStart, -7);
  }

  let streak = 0;
  for (let i = 0; i < 260; i++) {
    const days = uniqueDaysInRange(list, weekStart, addDays(weekStart, 7));
    if (days < 4) break;
    streak += 1;
    weekStart = addDays(weekStart, -7);
  }
  return streak;
}

export function suggestedCadence(checkIns: CheckIn[] | undefined): CadenceHint {
  const list = checkIns ?? [];
  const last3 = list.slice(0, 3);
  if (last3.length === 3 && last3.every((c) => c.mood <= 4 || c.anxiety >= 7)) {
    return 'struggling';
  }
  const last7 = list.slice(0, 7);
  if (last7.length === 7) {
    const avgMood = last7.reduce((sum, c) => sum + c.mood, 0) / 7;
    const avgAnxiety = last7.reduce((sum, c) => sum + c.anxiety, 0) / 7;
    if (avgMood >= 7 && avgAnxiety <= 4) return 'stable';
  }
  return 'daily';
}

export function cadenceGuidance(cadence: CadenceHint): string {
  if (cadence === 'struggling') {
    return 'Checking in twice a day can help right now — extra check-ins are always welcome.';
  }
  if (cadence === 'stable') {
    return 'A couple of times this week is enough.';
  }
  return 'A daily check-in is a good rhythm — log extra anytime you want.';
}

export function rangeAverage(
  checkIns: CheckIn[] | undefined,
  metric: 'mood' | 'anxiety' | 'energy',
  start: Date,
  endExclusive: Date,
): number | null {
  const vals: number[] = [];
  for (const c of checkIns ?? []) {
    const t = new Date(c.timestamp);
    if (t >= start && t < endExclusive) vals.push(c[metric]);
  }
  if (!vals.length) return null;
  return vals.reduce((sum, n) => sum + n, 0) / vals.length;
}

export function trendDirection(current: number | null, prior: number | null, epsilon = 0.15): TrendDirection | null {
  if (current == null || prior == null) return null;
  const diff = current - prior;
  if (Math.abs(diff) < epsilon) return 'steady';
  return diff > 0 ? 'up' : 'down';
}

export function trendSentence(metricLabel: string, direction: TrendDirection, windowDays: 14 | 28): string {
  const window = windowDays === 14 ? 'the prior 2 weeks' : 'the prior 4 weeks';
  if (direction === 'steady') return `${metricLabel} is steady vs ${window}.`;
  return `${metricLabel} is ${direction} vs ${window}.`;
}

export interface WindowAvgs {
  mood: number | null;
  anxiety: number | null;
  energy: number | null;
}

export interface MultiWeekTrend {
  last14: WindowAvgs;
  prior14: WindowAvgs;
  last28: WindowAvgs;
  prior28: WindowAvgs;
  sentences14: string[];
  sentences28: string[];
}

function windowAvgs(checkIns: CheckIn[] | undefined, start: Date, endExclusive: Date): WindowAvgs {
  return {
    mood: rangeAverage(checkIns, 'mood', start, endExclusive),
    anxiety: rangeAverage(checkIns, 'anxiety', start, endExclusive),
    energy: rangeAverage(checkIns, 'energy', start, endExclusive),
  };
}

export function multiWeekTrend(checkIns: CheckIn[] | undefined, now = new Date()): MultiWeekTrend {
  const today = dayStart(now);
  const tomorrow = addDays(today, 1);
  const last14Start = addDays(today, -13);
  const prior14Start = addDays(today, -27);
  const last28Start = addDays(today, -27);
  const prior28Start = addDays(today, -55);

  const last14 = windowAvgs(checkIns, last14Start, tomorrow);
  const prior14 = windowAvgs(checkIns, prior14Start, last14Start);
  const last28 = windowAvgs(checkIns, last28Start, tomorrow);
  const prior28 = windowAvgs(checkIns, prior28Start, last28Start);

  const sentences14: string[] = [];
  const mood14 = trendDirection(last14.mood, prior14.mood);
  const anxiety14 = trendDirection(last14.anxiety, prior14.anxiety);
  const energy14 = trendDirection(last14.energy, prior14.energy);
  if (mood14) sentences14.push(trendSentence('Mood', mood14, 14));
  if (anxiety14) sentences14.push(trendSentence('Anxiety', anxiety14, 14));
  if (energy14) sentences14.push(trendSentence('Energy', energy14, 14));

  const sentences28: string[] = [];
  const mood28 = trendDirection(last28.mood, prior28.mood);
  const anxiety28 = trendDirection(last28.anxiety, prior28.anxiety);
  const energy28 = trendDirection(last28.energy, prior28.energy);
  if (mood28) sentences28.push(trendSentence('Mood', mood28, 28));
  if (anxiety28) sentences28.push(trendSentence('Anxiety', anxiety28, 28));
  if (energy28) sentences28.push(trendSentence('Energy', energy28, 28));

  return { last14, prior14, last28, prior28, sentences14, sentences28 };
}
