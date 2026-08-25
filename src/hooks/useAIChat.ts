import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { readFunctionError, supabase } from '../lib/supabase';
import type { AIChatMessage, AIChatSummary } from '../types';

export const DAILY_AI_CHAT_MESSAGE_LIMIT = 10;

function mapMessage(row: Record<string, unknown>): AIChatMessage {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    role: row.role as AIChatMessage['role'],
    content: row.content as string,
    flagged: row.flagged as boolean,
    flagReason: (row.flag_reason as string) ?? null,
    timestamp: row.created_at as string,
  };
}

function mapSummary(row: Record<string, unknown>): AIChatSummary {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    summary: row.summary as string,
    keyPoints: row.key_points as string[],
    concerns: row.concerns as string[],
    lastUpdated: row.created_at as string,
  };
}

export function useAIChatMessages(patientId: string | undefined) {
  return useQuery({
    queryKey: ['ai_chat_messages', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => mapMessage(row as Record<string, unknown>));
    },
    enabled: !!patientId,
  });
}

export function useTodaysAIChatMessageCount(patientId: string | undefined) {
  const { data: messages } = useAIChatMessages(patientId);
  if (!messages) return 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return messages.filter((m) => m.role === 'user' && new Date(m.timestamp) >= todayStart).length;
}

export function useSendAIChatMessage(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (message: string) => {
      const { data, error } = await supabase.functions.invoke('ai-chat-reply', { body: { message } });
      if (error) throw new Error(await readFunctionError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_chat_messages', patientId] });
    },
  });
}

export function useAIChatSummary(patientId: string | undefined) {
  return useQuery({
    queryKey: ['ai_chat_summary', patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('latest_ai_chat_summaries').select('*').eq('patient_id', patientId).maybeSingle();
      if (error) throw error;
      return data ? mapSummary(data as Record<string, unknown>) : null;
    },
    enabled: !!patientId,
  });
}

export function useGenerateAIChatSummary(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!patientId) throw new Error('Missing patient id');
      const { data, error } = await supabase.functions.invoke('generate-ai-chat-summary', {
        body: { patient_id: patientId },
      });
      if (error) throw new Error(await readFunctionError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_chat_summary', patientId] });
      queryClient.invalidateQueries({ queryKey: ['audit_log', patientId] });
    },
  });
}
