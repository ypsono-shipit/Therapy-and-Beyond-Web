import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Alert } from '../types';

function mapRow(row: Record<string, unknown>): Alert {
  const patients = row.patients as { profiles?: { name?: string } } | null;
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    patientName: patients?.profiles?.name ?? 'Unknown Patient',
    type: row.type as Alert['type'],
    message: row.message as string,
    severity: row.severity as Alert['severity'],
    timestamp: row.created_at as string,
    resolved: row.resolved as boolean,
  };
}

export function useAlerts(patientId?: string) {
  return useQuery({
    queryKey: ['alerts', patientId ?? 'all'],
    queryFn: async () => {
      let query = supabase.from('alerts').select('*, patients(profiles(name))').order('created_at', { ascending: false });
      if (patientId) query = query.eq('patient_id', patientId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase.rpc('resolve_alert', { p_alert_id: alertId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
