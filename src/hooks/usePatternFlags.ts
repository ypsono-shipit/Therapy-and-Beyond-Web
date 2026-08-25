import { useMemo } from 'react';
import type { AlertType, CheckIn } from '../types';
import type { NormalizedSeverity } from '../lib/risk';

export interface PatternFlag {
  type: Extract<AlertType, 'risk_warning' | 'sleep_mood' | 'work_stress' | 'isolation' | 'med_pattern'>;
  message: string;
  severity: NormalizedSeverity;
}

const WORK_RE = /\b(work|job|boss|workplace|coworker|colleague|overtime|deadline)\b/i;
const ISO_RE = /\b(lonely|alone|isolated|isolation|nobody|no one|withdrawn)\b/i;

function blob(c: CheckIn): string {
  return `${c.notes ?? ''} ${c.significantEvent ?? ''} ${c.stressors ?? ''}`;
}

/** Heuristic flags from recent check-ins. Does not write alerts. */
export function derivePatternFlags(checkIns: CheckIn[]): PatternFlag[] {
  const recent = checkIns.slice(0, 7);
  if (recent.length === 0) return [];

  const flags: PatternFlag[] = [];
  const n = recent.length;

  const missedMeds = recent.filter((c) => c.medicationTaken === false).length;
  if (missedMeds >= 2) {
    flags.push({
      type: 'med_pattern',
      message: `Missed medication on ${missedMeds} of the last ${n} check-ins.`,
      severity: missedMeds >= 4 ? 'high' : 'moderate',
    });
  }

  const sleepMood = recent.filter(
    (c) => (c.sleepQuality === 'Poor' || c.sleepQuality === 'Fair') && c.mood <= 4,
  ).length;
  if (sleepMood >= 3) {
    flags.push({
      type: 'sleep_mood',
      message: `Poor sleep with low mood on ${sleepMood} of the last ${n} check-ins.`,
      severity: 'moderate',
    });
  }

  const workHits = recent.filter((c) => WORK_RE.test(blob(c))).length;
  if (workHits >= 2) {
    flags.push({
      type: 'work_stress',
      message: `Work-related stress mentioned in ${workHits} recent check-ins.`,
      severity: 'moderate',
    });
  }

  const isoHits = recent.filter((c) => ISO_RE.test(blob(c))).length;
  if (isoHits >= 2) {
    flags.push({
      type: 'isolation',
      message: `Isolation language in ${isoHits} recent check-ins.`,
      severity: 'moderate',
    });
  }

  const crisis = recent.filter((c) => c.mood <= 2 || c.anxiety >= 9);
  if (crisis.length >= 1) {
    flags.push({
      type: 'risk_warning',
      message:
        crisis.length === 1
          ? 'A recent check-in had very low mood or severe anxiety.'
          : `${crisis.length} recent check-ins had very low mood or severe anxiety.`,
      severity: crisis.some((c) => c.mood <= 1) ? 'high' : 'moderate',
    });
  }

  return flags;
}

export function usePatternFlags(checkIns: CheckIn[] | undefined): PatternFlag[] {
  return useMemo(() => derivePatternFlags(checkIns ?? []), [checkIns]);
}
