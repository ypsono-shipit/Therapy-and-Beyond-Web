import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
}

export function useAuditLog(patientId: string | undefined) {
  return useQuery({
    queryKey: ['audit_log', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id as string,
        actor: row.actor_label as string,
        action: row.action as string,
        timestamp: row.created_at as string,
      })) as AuditLogEntry[];
    },
    enabled: !!patientId,
  });
}

export function useLogAuditEvent() {
  return useMutation({
    mutationFn: async ({ patientId, action }: { patientId: string; action: string }) => {
      const { error } = await supabase.rpc('log_audit_event', { p_patient_id: patientId, p_action: action });
      if (error) throw error;
    },
  });
}
