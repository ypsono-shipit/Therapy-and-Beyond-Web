import type { Alert, AlertSeverity } from '../types';

export type NormalizedSeverity = 'low' | 'moderate' | 'high' | 'urgent';
export type RiskLevel = NormalizedSeverity | 'none';

export function normalizeSeverity(s: AlertSeverity | string | null | undefined): NormalizedSeverity {
  if (s === 'urgent') return 'urgent';
  if (s === 'high') return 'high';
  if (s === 'medium' || s === 'moderate') return 'moderate';
  return 'low';
}

/** urgent=4, high=3, moderate=2, low=1 */
export function rank(s: AlertSeverity | string | null | undefined): number {
  switch (normalizeSeverity(s)) {
    case 'urgent':
      return 4;
    case 'high':
      return 3;
    case 'moderate':
      return 2;
    default:
      return 1;
  }
}

/** Highest unresolved severity for a patient, or `'none'`. */
export function patientRiskLevel(alerts: Alert[]): RiskLevel {
  const open = alerts.filter((a) => !a.resolved);
  if (open.length === 0) return 'none';
  return open.reduce<NormalizedSeverity>((highest, a) => {
    const next = normalizeSeverity(a.severity);
    return rank(next) > rank(highest) ? next : highest;
  }, 'low');
}
