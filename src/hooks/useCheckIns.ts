import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { CheckIn } from '../types';

function mapRow(row: Record<string, unknown>): CheckIn {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    mood: row.mood as number,
    anxiety: row.anxiety as number,
    energy: row.energy as number,
    sleepDuration: row.sleep_duration as number,
    sleepQuality: row.sleep_quality as CheckIn['sleepQuality'],
    medicationTaken: row.medication_taken as boolean,
    significantEvent: (row.significant_event as string) ?? '',
    notes: (row.notes as string) ?? '',
    timestamp: row.created_at as string,
    source: (row.source as CheckIn['source']) ?? 'patient',
    appetite: (row.appetite as number | null) ?? null,
    functioning: (row.functioning as number | null) ?? null,
    copingUsed: (row.coping_used as string[] | null) ?? [],
    wins: (row.wins as string) ?? '',
    stressors: (row.stressors as string) ?? '',
    cyclePhase: (row.cycle_phase as string) ?? '',
  };
}

export function hasCheckedInToday(checkIns: CheckIn[] | undefined): boolean {
  if (!checkIns?.length) return false;
  const todayKey = new Date().toDateString();
  return checkIns.some((c) => new Date(c.timestamp).toDateString() === todayKey);
}

export function useCheckIns(patientId: string | undefined) {
  return useQuery({
    queryKey: ['check_ins', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
    enabled: !!patientId,
  });
}

export interface NewCheckIn {
  mood: number;
  anxiety: number;
  energy: number;
  sleepDuration: number;
  sleepQuality: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  medicationTaken: boolean;
  significantEvent: string;
  notes: string;
  appetite?: number | null;
  functioning?: number | null;
  copingUsed?: string[];
  wins?: string;
  stressors?: string;
  cyclePhase?: string;
}

export function useSubmitCheckIn(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewCheckIn) => {
      if (!patientId) throw new Error('Missing patient id');
      const { error } = await supabase.from('check_ins').insert({
        patient_id: patientId,
        mood: input.mood,
        anxiety: input.anxiety,
        energy: input.energy,
        sleep_duration: input.sleepDuration,
        sleep_quality: input.sleepQuality,
        medication_taken: input.medicationTaken,
        significant_event: input.significantEvent || null,
        notes: input.notes || null,
        appetite: input.appetite ?? null,
        functioning: input.functioning ?? null,
        coping_used: input.copingUsed?.length ? input.copingUsed : null,
        wins: input.wins || null,
        stressors: input.stressors || null,
        cycle_phase: input.cyclePhase || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['check_ins', patientId] });
      queryClient.invalidateQueries({ queryKey: ['audit_log', patientId] });
    },
  });
}
