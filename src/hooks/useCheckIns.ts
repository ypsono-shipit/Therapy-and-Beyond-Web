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
      });
      if (error) {
        if (error.code === '23505') throw new Error("You've already checked in today.");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['check_ins', patientId] });
      queryClient.invalidateQueries({ queryKey: ['audit_log', patientId] });
    },
  });
}
