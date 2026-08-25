import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { LifeEvent } from '../types';

function mapRow(row: Record<string, unknown>): LifeEvent {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    label: row.label as string,
    occurredOn: row.occurred_on as string,
  };
}

export function useLifeEvents(patientId: string | undefined) {
  return useQuery({
    queryKey: ['life_events', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('life_events')
        .select('*')
        .eq('patient_id', patientId)
        .order('occurred_on', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
    },
    enabled: !!patientId,
  });
}

export function useCreateLifeEvent(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ label, occurredOn }: { label: string; occurredOn: string }) => {
      if (!patientId) throw new Error('Missing patient id');
      const { error } = await supabase.from('life_events').insert({
        patient_id: patientId,
        label: label.trim(),
        occurred_on: occurredOn,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life_events', patientId] });
    },
  });
}

export function useUpdateLifeEvent(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, label, occurredOn }: { id: string; label: string; occurredOn: string }) => {
      const { error } = await supabase
        .from('life_events')
        .update({ label: label.trim(), occurred_on: occurredOn })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life_events', patientId] });
    },
  });
}

export function useDeleteLifeEvent(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('life_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life_events', patientId] });
    },
  });
}
