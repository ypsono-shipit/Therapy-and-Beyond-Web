import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type {
  CopingItem,
  CopingKind,
  EmergencyContact,
  HelpfulStrategy,
  ReminderPrefs,
  SafetyPlan,
} from '../types';

export const COPING_PRESETS: Array<{ kind: CopingKind; title: string; body: string; url: string | null }> = [
  {
    kind: 'breathing',
    title: 'Box breathing',
    body: 'Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat for 1–2 minutes when anxiety spikes.',
    url: null,
  },
  {
    kind: 'breathing',
    title: '4-7-8 breathing',
    body: 'Inhale quietly through the nose for 4, hold for 7, exhale through the mouth for 8. Repeat up to 4 cycles.',
    url: null,
  },
  {
    kind: 'grounding',
    title: '5-4-3-2-1 grounding',
    body: 'Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. Slow down with each one.',
    url: null,
  },
  {
    kind: 'grounding',
    title: 'Feet on the floor',
    body: 'Press both feet into the ground. Notice pressure, temperature, and contact. Name three colours in the room.',
    url: null,
  },
  {
    kind: 'crisis_plan',
    title: 'If I am in crisis',
    body: 'Skip the rest of this app. Call SOS 1-767, IMH 6389 2222, or ambulance 995. If you can, also call a trusted contact.',
    url: null,
  },
  {
    kind: 'playlist',
    title: 'Calming playlist',
    body: 'Add your own item with a link to music that helps you settle. Play it when thoughts speed up.',
    url: null,
  },
  {
    kind: 'affirmation',
    title: 'This feeling will pass',
    body: 'I can get through this moment. Feelings rise and fall. I am still here.',
    url: null,
  },
  {
    kind: 'distraction',
    title: '10-minute reset',
    body: 'A short walk, a puzzle, washing a mug, or stepping outside. Do one small thing that is not the crisis.',
    url: null,
  },
];

function mapContact(row: Record<string, unknown>): EmergencyContact {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    name: row.name as string,
    relationship: (row.relationship as string) ?? '',
    phone: row.phone as string,
    isPrimary: Boolean(row.is_primary),
  };
}

function mapPlan(row: Record<string, unknown>): SafetyPlan {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    warningSigns: (row.warning_signs as string[]) ?? [],
    internalCoping: (row.internal_coping as string[]) ?? [],
    peopleAndPlaces: (row.people_and_places as string[]) ?? [],
    professionalHelp: (row.professional_help as string[]) ?? [],
    makeEnvironmentSafe: (row.make_environment_safe as string[]) ?? [],
    reasonsForLiving: (row.reasons_for_living as string[]) ?? [],
    updatedAt: row.updated_at as string,
  };
}

function mapCoping(row: Record<string, unknown>): CopingItem {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    kind: row.kind as CopingKind,
    title: row.title as string,
    body: (row.body as string) ?? '',
    url: (row.url as string | null) ?? null,
    isPreset: Boolean(row.is_preset),
  };
}

function mapStrategy(row: Record<string, unknown>): HelpfulStrategy {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    strategy: row.strategy as string,
    source: (row.source as string) ?? 'patient',
    timesUsed: (row.times_used as number) ?? 1,
    lastUsedAt: row.last_used_at as string,
  };
}

function mapReminder(row: Record<string, unknown>): ReminderPrefs {
  return {
    patient_id: row.patient_id as string,
    groundingCadence: row.grounding_cadence as ReminderPrefs['groundingCadence'],
    setBy: row.set_by as ReminderPrefs['setBy'],
  };
}

export function useEmergencyContacts(patientId: string | undefined) {
  return useQuery({
    queryKey: ['emergency_contacts', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('patient_id', patientId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => mapContact(row as Record<string, unknown>));
    },
    enabled: !!patientId,
  });
}

export interface EmergencyContactInput {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export function useSaveEmergencyContact(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EmergencyContactInput) => {
      if (!patientId) throw new Error('Missing patient id');
      if (input.isPrimary) {
        const { error: clearError } = await supabase
          .from('emergency_contacts')
          .update({ is_primary: false })
          .eq('patient_id', patientId);
        if (clearError) throw clearError;
      }
      if (input.id) {
        const { error } = await supabase
          .from('emergency_contacts')
          .update({
            name: input.name.trim(),
            relationship: input.relationship.trim() || null,
            phone: input.phone.trim(),
            is_primary: input.isPrimary,
          })
          .eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('emergency_contacts').insert({
          patient_id: patientId,
          name: input.name.trim(),
          relationship: input.relationship.trim() || null,
          phone: input.phone.trim(),
          is_primary: input.isPrimary,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency_contacts', patientId] });
    },
  });
}

export function useDeleteEmergencyContact(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency_contacts', patientId] });
    },
  });
}

export function useSafetyPlan(patientId: string | undefined) {
  return useQuery({
    queryKey: ['safety_plans', patientId],
    queryFn: async (): Promise<SafetyPlan | null> => {
      const { data, error } = await supabase.from('safety_plans').select('*').eq('patient_id', patientId).maybeSingle();
      if (error) throw error;
      return data ? mapPlan(data as Record<string, unknown>) : null;
    },
    enabled: !!patientId,
  });
}

export type SafetyPlanDraft = Pick<
  SafetyPlan,
  'warningSigns' | 'internalCoping' | 'peopleAndPlaces' | 'professionalHelp' | 'makeEnvironmentSafe' | 'reasonsForLiving'
>;

export const EMPTY_SAFETY_PLAN: SafetyPlanDraft = {
  warningSigns: [],
  internalCoping: [],
  peopleAndPlaces: [],
  professionalHelp: [],
  makeEnvironmentSafe: [],
  reasonsForLiving: [],
};

export function useSaveSafetyPlan(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: SafetyPlanDraft) => {
      if (!patientId) throw new Error('Missing patient id');
      const { error } = await supabase.from('safety_plans').upsert(
        {
          patient_id: patientId,
          warning_signs: draft.warningSigns,
          internal_coping: draft.internalCoping,
          people_and_places: draft.peopleAndPlaces,
          professional_help: draft.professionalHelp,
          make_environment_safe: draft.makeEnvironmentSafe,
          reasons_for_living: draft.reasonsForLiving,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'patient_id' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety_plans', patientId] });
    },
  });
}

export function useCopingItems(patientId: string | undefined) {
  return useQuery({
    queryKey: ['coping_items', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coping_items')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data.map((row) => mapCoping(row as Record<string, unknown>));

      const { data: inserted, error: insertError } = await supabase
        .from('coping_items')
        .insert(
          COPING_PRESETS.map((p) => ({
            patient_id: patientId,
            kind: p.kind,
            title: p.title,
            body: p.body,
            url: p.url,
            is_preset: true,
          })),
        )
        .select();
      if (insertError) throw insertError;
      return (inserted ?? []).map((row) => mapCoping(row as Record<string, unknown>));
    },
    enabled: !!patientId,
  });
}

export interface CopingItemInput {
  kind: CopingKind;
  title: string;
  body: string;
  url: string | null;
}

export function useAddCopingItem(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CopingItemInput) => {
      if (!patientId) throw new Error('Missing patient id');
      const { error } = await supabase.from('coping_items').insert({
        patient_id: patientId,
        kind: input.kind,
        title: input.title.trim(),
        body: input.body.trim() || null,
        url: input.url?.trim() || null,
        is_preset: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coping_items', patientId] });
    },
  });
}

export function useDeleteCopingItem(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coping_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coping_items', patientId] });
    },
  });
}

export function useHelpfulStrategies(patientId: string | undefined) {
  return useQuery({
    queryKey: ['helpful_strategies', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('helpful_strategies')
        .select('*')
        .eq('patient_id', patientId)
        .order('last_used_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => mapStrategy(row as Record<string, unknown>));
    },
    enabled: !!patientId,
  });
}

export function useAddHelpfulStrategy(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (strategy: string) => {
      if (!patientId) throw new Error('Missing patient id');
      const { error } = await supabase.from('helpful_strategies').insert({
        patient_id: patientId,
        strategy: strategy.trim(),
        source: 'patient',
        times_used: 1,
        last_used_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpful_strategies', patientId] });
    },
  });
}

export function useBumpHelpfulStrategy(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: HelpfulStrategy) => {
      const { error } = await supabase
        .from('helpful_strategies')
        .update({
          times_used: item.timesUsed + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpful_strategies', patientId] });
    },
  });
}

export function useDeleteHelpfulStrategy(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('helpful_strategies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpful_strategies', patientId] });
    },
  });
}

export function useReminderPrefs(patientId: string | undefined) {
  return useQuery({
    queryKey: ['reminder_prefs', patientId],
    queryFn: async (): Promise<ReminderPrefs> => {
      const { data, error } = await supabase.from('reminder_prefs').select('*').eq('patient_id', patientId).maybeSingle();
      if (error) throw error;
      if (data) return mapReminder(data as Record<string, unknown>);

      const { data: inserted, error: insertError } = await supabase
        .from('reminder_prefs')
        .insert({
          patient_id: patientId,
          grounding_cadence: 'weekly',
          set_by: 'patient',
        })
        .select()
        .single();
      if (insertError) {
        const { data: retry, error: retryError } = await supabase
          .from('reminder_prefs')
          .select('*')
          .eq('patient_id', patientId)
          .single();
        if (retryError) throw insertError;
        return mapReminder(retry as Record<string, unknown>);
      }
      return mapReminder(inserted as Record<string, unknown>);
    },
    enabled: !!patientId,
  });
}

export function useSaveReminderPrefs(patientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cadence: ReminderPrefs['groundingCadence']) => {
      if (!patientId) throw new Error('Missing patient id');
      const { error } = await supabase.from('reminder_prefs').upsert(
        {
          patient_id: patientId,
          grounding_cadence: cadence,
          set_by: 'patient',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'patient_id' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder_prefs', patientId] });
    },
  });
}
