import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { FALLBACK_AVATAR, type Patient } from '../types';

function mapRow(row: Record<string, unknown>): Patient {
  const profiles = row.profiles as { name?: string; email?: string; avatar_url?: string } | null;
  return {
    id: row.id as string,
    clinician_id: (row.clinician_id as string | null) ?? null,
    name: profiles?.name ?? 'Unknown',
    email: profiles?.email ?? '',
    avatar: profiles?.avatar_url ?? FALLBACK_AVATAR,
    age: (row.age as number) ?? 0,
    gender: (row.gender as string) ?? '',
    demographics: {
      pronouns: (row.pronouns as string) ?? '',
      occupation: (row.occupation as string) ?? '',
      maritalStatus: (row.marital_status as string) ?? '',
      phone: (row.phone as string) ?? '',
      emergencyContact: (row.emergency_contact as string) ?? '',
    },
    streakDays: row.streak_days as number,
    lastCheckInDate: (row.last_check_in_date as string) ?? '',
  };
}

const PATIENT_SELECT =
  'id, clinician_id, age, gender, pronouns, occupation, marital_status, phone, emergency_contact, streak_days, last_check_in_date, profiles(name, email, avatar_url)';

export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('patients').select(PATIENT_SELECT);
      if (error) throw error;
      return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
    },
  });
}

export function usePatientRecord(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patients', patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('patients').select(PATIENT_SELECT).eq('id', patientId).single();
      if (error) throw error;
      return mapRow(data as Record<string, unknown>);
    },
    enabled: !!patientId,
  });
}
