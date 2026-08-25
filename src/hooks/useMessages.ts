import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Message, UserRole } from '../types';

function mapRow(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    sender: row.sender_role as Message['sender'],
    text: row.text as string,
    timestamp: row.created_at as string,
    isCompletedExercise: row.is_completed_exercise as boolean,
  };
}

export function useMessages(patientId: string | undefined) {
  return useQuery({
    queryKey: ['messages', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
    },
    enabled: !!patientId,
  });
}

export function useSendMessage(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ senderId, role, text }: { senderId: string; role: UserRole; text: string }) => {
      if (!patientId) throw new Error('Missing patient id');
      const { error } = await supabase.from('messages').insert({
        patient_id: patientId,
        sender_id: senderId,
        sender_role: role,
        text,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', patientId] });
    },
  });
}
