import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Session } from '../types';

function mapRow(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    clinician_id: row.clinician_id as string,
    date: row.date as string,
    time: row.time as string,
    notes: (row.notes as string) ?? '',
    status: row.status as Session['status'],
    type: row.type as Session['type'],
  };
}

export function useSessions(patientId: string | undefined) {
  return useQuery({
    queryKey: ['sessions', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
    },
    enabled: !!patientId,
  });
}

export function useUpcomingSessionsCount() {
  return useQuery({
    queryKey: ['sessions', 'upcoming_count'],
    queryFn: async () => {
      const { count, error } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'scheduled');
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export interface NewSession {
  patientId: string;
  clinicianId: string;
  date: string;
  time: string;
  type: 'In-Hand' | 'Telehealth';
  notes: string;
}

export function useCreateSession(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (session: NewSession) => {
      const { error } = await supabase.from('sessions').insert({
        patient_id: session.patientId,
        clinician_id: session.clinicianId,
        date: session.date,
        time: session.time,
        type: session.type,
        notes: session.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', patientId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'upcoming_count'] });
    },
  });
}

export function useUpdateSessionStatus(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: 'completed' | 'canceled' }) => {
      const { error } = await supabase.from('sessions').update({ status }).eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', patientId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'upcoming_count'] });
    },
  });
}
