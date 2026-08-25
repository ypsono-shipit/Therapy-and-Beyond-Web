import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Insight } from '../types';

function mapRow(row: Record<string, unknown>): Insight {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    summary: row.summary as string,
    themes: row.themes as Insight['themes'],
    recommendations: row.recommendations as string[],
    suggestedDiscussionTopics: row.suggested_discussion_topics as string[],
    lastUpdated: row.created_at as string,
  };
}

export function useInsight(patientId: string | undefined) {
  return useQuery({
    queryKey: ['insight', patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('latest_insights').select('*').eq('patient_id', patientId).maybeSingle();
      if (error) throw error;
      return data ? mapRow(data as Record<string, unknown>) : null;
    },
    enabled: !!patientId,
  });
}

export function useGenerateInsight(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!patientId) throw new Error('Missing patient id');
      const { data, error } = await supabase.functions.invoke('generate-insight', {
        body: { patient_id: patientId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insight', patientId] });
      queryClient.invalidateQueries({ queryKey: ['audit_log', patientId] });
    },
  });
}
