import { useMemo } from 'react';
import type { Alert, Insight, Session } from '../types';
import { useAlerts } from './useAlerts';
import { useCheckIns } from './useCheckIns';
import { useInsight } from './useInsight';
import { useLifeEvents } from './useLifeEvents';
import { useSessions } from './useSessions';

export interface SymptomAverages {
  mood: number | null;
  anxiety: number | null;
  energy: number | null;
  sleepDuration: number | null;
  appetite: number | null;
  functioning: number | null;
}

export interface BriefingWin {
  text: string;
  date: string;
}

export interface TimelineItem {
  id: string;
  date: string;
  label: string;
  kind: 'life_event' | 'check_in';
}

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round((values.reduce((sum, n) => sum + n, 0) / values.length) * 10) / 10;
}

function lastCompletedSession(sessions: Session[]): Session | undefined {
  return [...sessions]
    .filter((s) => s.status === 'completed')
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))[0];
}

function uniqueKeepOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

export function useBriefing(patientId: string | undefined) {
  const checkInsQuery = useCheckIns(patientId);
  const sessionsQuery = useSessions(patientId);
  const alertsQuery = useAlerts(patientId);
  const insightQuery = useInsight(patientId);
  const lifeEventsQuery = useLifeEvents(patientId);

  const computed = useMemo(() => {
    const checkIns = checkInsQuery.data ?? [];
    const sessions = sessionsQuery.data ?? [];
    const lastSession = lastCompletedSession(sessions);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const since = lastSession ? new Date(`${lastSession.date}T00:00:00`) : fourteenDaysAgo;
    const windowLabel = lastSession ? `since last session (${lastSession.date})` : 'last 14 days';
    const inWindow = checkIns.filter((c) => new Date(c.timestamp) >= since);

    const averages: SymptomAverages = {
      mood: mean(inWindow.map((c) => c.mood)),
      anxiety: mean(inWindow.map((c) => c.anxiety)),
      energy: mean(inWindow.map((c) => c.energy)),
      sleepDuration: mean(inWindow.map((c) => c.sleepDuration)),
      appetite: mean(inWindow.filter((c) => c.appetite != null).map((c) => c.appetite as number)),
      functioning: mean(inWindow.filter((c) => c.functioning != null).map((c) => c.functioning as number)),
    };

    const stressors = uniqueKeepOrder(inWindow.flatMap((c) => [c.stressors ?? '', c.significantEvent ?? '']));
    const copingUsed = uniqueKeepOrder(inWindow.flatMap((c) => c.copingUsed ?? []));
    const wins: BriefingWin[] = inWindow
      .filter((c) => (c.wins ?? '').trim())
      .map((c) => ({ text: (c.wins as string).trim(), date: c.timestamp }));

    const openAlerts: Alert[] = (alertsQuery.data ?? []).filter((a) => !a.resolved);

    const fromEvents: TimelineItem[] = (lifeEventsQuery.data ?? []).map((e) => ({
      id: `life-${e.id}`,
      date: e.occurredOn,
      label: e.label,
      kind: 'life_event',
    }));
    const fromCheckIns: TimelineItem[] = checkIns
      .filter((c) => (c.significantEvent ?? '').trim())
      .map((c) => ({
        id: `checkin-${c.id}`,
        date: c.timestamp.slice(0, 10),
        label: c.significantEvent.trim(),
        kind: 'check_in' as const,
      }));
    const timeline = [...fromEvents, ...fromCheckIns].sort((a, b) => b.date.localeCompare(a.date));

    return {
      since,
      windowLabel,
      checkInCount: inWindow.length,
      averages,
      stressors,
      copingUsed,
      wins,
      openAlerts,
      timeline,
    };
  }, [checkInsQuery.data, sessionsQuery.data, alertsQuery.data, lifeEventsQuery.data]);

  return {
    ...computed,
    insight: (insightQuery.data ?? null) as Insight | null,
    isLoading:
      checkInsQuery.isLoading ||
      sessionsQuery.isLoading ||
      alertsQuery.isLoading ||
      insightQuery.isLoading ||
      lifeEventsQuery.isLoading,
  };
}
