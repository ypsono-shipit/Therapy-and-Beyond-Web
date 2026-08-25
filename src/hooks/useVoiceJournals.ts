import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { VoiceJournal } from '../types';

export interface VoiceJournalRow extends VoiceJournal {
  storagePath: string;
  transcriptionStatus: string;
}

function mapRow(row: Record<string, unknown>): VoiceJournalRow {
  const seconds = (row.audio_duration_seconds as number) ?? 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    transcript: (row.transcript as string) ?? '',
    audioDuration: `${mins}:${String(secs).padStart(2, '0')}`,
    timestamp: row.created_at as string,
    storagePath: row.storage_path as string,
    transcriptionStatus: row.transcription_status as string,
  };
}

export function useVoiceJournals(patientId: string | undefined) {
  return useQuery({
    queryKey: ['voice_journals', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voice_journals')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
    },
    enabled: !!patientId,
    refetchInterval: (query) => {
      const stillProcessing = query.state.data?.some(
        (j) => j.transcriptionStatus === 'pending' || j.transcriptionStatus === 'processing',
      );
      return stillProcessing ? 3000 : false;
    },
  });
}

export function useUploadVoiceJournal(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ blob, durationSeconds, mimeType }: { blob: Blob; durationSeconds: number; mimeType: string }) => {
      if (!patientId) throw new Error('Missing patient id');
      const journalId = crypto.randomUUID();
      const ext = mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : mimeType.includes('mpeg') ? 'mp3' : 'webm';
      const storagePath = `${patientId}/${journalId}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('voice-journal-audio').upload(storagePath, blob, {
        contentType: mimeType || `audio/${ext}`,
      });
      if (uploadError) throw uploadError;

      const { data: row, error: insertError } = await supabase
        .from('voice_journals')
        .insert({
          id: journalId,
          patient_id: patientId,
          storage_path: storagePath,
          audio_duration_seconds: Math.round(durationSeconds),
        })
        .select()
        .single();
      if (insertError) throw insertError;

      const { error: fnError } = await supabase.functions.invoke('transcribe-voice-note', {
        body: { voice_journal_id: journalId },
      });
      if (fnError) console.warn('transcribe-voice-note invocation failed', fnError);

      return row;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice_journals', patientId] });
      queryClient.invalidateQueries({ queryKey: ['audit_log', patientId] });
    },
  });
}

export async function getPlaybackUrl(storagePath: string) {
  const { data, error } = await supabase.storage.from('voice-journal-audio').createSignedUrl(storagePath, 60);
  if (error) throw error;
  return data.signedUrl;
}
