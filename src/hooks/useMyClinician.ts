import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { FALLBACK_CLINICIAN_AVATAR } from '../types';

export interface ClinicianInfo {
  id: string;
  name: string;
  title: string;
  clinic: string;
  avatar: string;
  email: string;
  officeHours: string;
  officeHoursTz: string;
  officeHoursNote: string;
}

export interface ClinicianSettings {
  officeHours: string;
  officeHoursTz: string;
  officeHoursNote: string;
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
        .select('id, title, clinic, office_hours, office_hours_tz, office_hours_note, profiles(name, email, avatar_url)')
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
        officeHours: (data.office_hours as string) ?? '',
        officeHoursTz: (data.office_hours_tz as string) ?? 'Asia/Singapore',
        officeHoursNote: (data.office_hours_note as string) ?? '',
      };
    },
    enabled: !!patientId,
  });
}

export function useClinicianSettings(clinicianId: string | undefined) {
  return useQuery({
    queryKey: ['clinician_settings', clinicianId],
    queryFn: async (): Promise<ClinicianSettings> => {
      const { data, error } = await supabase
        .from('clinicians')
        .select('office_hours, office_hours_tz, office_hours_note')
        .eq('id', clinicianId)
        .single();
      if (error) throw error;
      return {
        officeHours: (data.office_hours as string) ?? '',
        officeHoursTz: (data.office_hours_tz as string) ?? 'Asia/Singapore',
        officeHoursNote: (data.office_hours_note as string) ?? '',
      };
    },
    enabled: !!clinicianId,
  });
}

export function useUpdateClinicianSettings(clinicianId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClinicianSettings) => {
      if (!clinicianId) throw new Error('Missing clinician id');
      const { error } = await supabase
        .from('clinicians')
        .update({
          office_hours: input.officeHours.trim() || null,
          office_hours_tz: input.officeHoursTz.trim() || 'Asia/Singapore',
          office_hours_note: input.officeHoursNote.trim() || null,
        })
        .eq('id', clinicianId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinician_settings', clinicianId] });
      queryClient.invalidateQueries({ queryKey: ['my_clinician'] });
    },
  });
}
