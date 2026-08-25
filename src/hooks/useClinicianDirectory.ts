import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface ClinicianDirectoryEntry {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  title: string | null;
  clinic: string | null;
}

export function useClinicianDirectory(search: string) {
  return useQuery({
    queryKey: ['clinician_directory', search.trim().toLowerCase()],
    queryFn: async () => {
      let query = supabase.from('clinician_directory').select('*').order('name');
      if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ClinicianDirectoryEntry[];
    },
  });
}
