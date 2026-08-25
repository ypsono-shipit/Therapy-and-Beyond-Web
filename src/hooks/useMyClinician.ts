import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { FALLBACK_CLINICIAN_AVATAR } from '../types';

export interface ClinicianInfo {
  id: string;
  name: string;
  title: string;
  clinic: string;
  avatar: string;
  email: string;
}

export function useMyClinician(patientId: string | undefined) {
  return useQuery({
    queryKey: ['my_clinician', patientId],
    queryFn: async (): Promise<ClinicianInfo | null> => {
      const { data: patientRow, error: patientError } = await supabase
        .from('patients')
        .select('clinician_id')
        .eq('id', patientId)
        .single();
      if (patientError) throw patientError;
      if (!patientRow?.clinician_id) return null;

      const { data, error } = await supabase
        .from('clinicians')
        .select('id, title, clinic, profiles(name, email, avatar_url)')
        .eq('id', patientRow.clinician_id)
        .single();
      if (error) throw error;
      const profile = (data as { profiles?: { name?: string; email?: string; avatar_url?: string } }).profiles;
      return {
        id: data.id as string,
        name: profile?.name ?? 'Your Clinician',
        title: (data.title as string) ?? '',
        clinic: (data.clinic as string) ?? '',
        avatar: profile?.avatar_url ?? FALLBACK_CLINICIAN_AVATAR,
        email: profile?.email ?? '',
      };
    },
    enabled: !!patientId,
  });
}
