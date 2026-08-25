import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Consent, ConsentType, Profile, UserRole } from '../types';

interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  consents: Record<ConsentType, boolean>;
  patientProvisioned: boolean | null;
  provisionError: string | null;
  needsClinicianSelection: boolean;
  hasClinician: boolean;
  signUp: (params: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
  }) => Promise<{ error: string | null; userId: string | null; hasSession: boolean }>;
  signIn: (params: { email: string; password: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  recordConsent: (consentType: ConsentType, granted: boolean) => Promise<{ error: string | null }>;
  retryProvisioning: () => Promise<void>;
  selectClinician: (clinicianId: string) => Promise<{ error: string | null }>;
  continueWithoutClinician: () => Promise<{ error: string | null }>;
  refreshProfile: (userId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [consents, setConsents] = useState<Record<ConsentType, boolean>>({} as Record<ConsentType, boolean>);
  const [patientProvisioned, setPatientProvisioned] = useState<boolean | null>(null);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [needsClinicianSelection, setNeedsClinicianSelection] = useState(false);
  const [hasClinician, setHasClinician] = useState(false);

  const loadProfileAndConsents = useCallback(async (userId: string) => {
    const { data: profileRow } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(profileRow as Profile | null);

    const { data: consentRows } = await supabase
      .from('current_consents')
      .select('consent_type, granted, policy_version')
      .eq('profile_id', userId);
    const map = {} as Record<ConsentType, boolean>;
    (consentRows as Consent[] | null)?.forEach((c) => {
      map[c.consent_type] = c.granted;
    });
    setConsents(map);

    if (profileRow?.role === 'patient') {
      const { data: patientRow } = await supabase
        .from('patients')
        .select('id, clinician_id')
        .eq('id', userId)
        .maybeSingle();
      setPatientProvisioned(!!patientRow);
      setHasClinician(!!patientRow?.clinician_id);
      if (patientRow) setNeedsClinicianSelection(false);
    } else {
      setPatientProvisioned(null);
      setHasClinician(false);
      setNeedsClinicianSelection(false);
    }
  }, []);

  const retryProvisioning = useCallback(async () => {
    if (!session?.user.id) return;
    setProvisionError(null);
    const { data, error } = await supabase.rpc('provision_patient');
    if (error) {
      setProvisionError(error.message);
      return;
    }
    if (data === 'needs_clinician_selection') {
      setNeedsClinicianSelection(true);
      return;
    }
    setNeedsClinicianSelection(false);
    await loadProfileAndConsents(session.user.id);
  }, [session, loadProfileAndConsents]);

  const selectClinician = useCallback(
    async (clinicianId: string) => {
      if (!session?.user.id) return { error: 'Not signed in' };
      const { error } = await supabase.rpc('provision_patient_with_clinician', { p_clinician_id: clinicianId });
      if (error) return { error: error.message };
      setNeedsClinicianSelection(false);
      await loadProfileAndConsents(session.user.id);
      return { error: null };
    },
    [session, loadProfileAndConsents],
  );

  const continueWithoutClinician = useCallback(async () => {
    if (!session?.user.id) return { error: 'Not signed in' };
    const { error } = await supabase.rpc('provision_patient_solo');
    if (error) return { error: error.message };
    setNeedsClinicianSelection(false);
    await loadProfileAndConsents(session.user.id);
    return { error: null };
  }, [session, loadProfileAndConsents]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user.id) await loadProfileAndConsents(data.session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user.id) {
        await loadProfileAndConsents(newSession.user.id);
      } else {
        setProfile(null);
        setConsents({} as Record<ConsentType, boolean>);
        setPatientProvisioned(null);
        setHasClinician(false);
        setNeedsClinicianSelection(false);
      }
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfileAndConsents]);

  useEffect(() => {
    if (profile?.role === 'patient' && patientProvisioned === false && !provisionError && !needsClinicianSelection) {
      void retryProvisioning();
    }
  }, [profile, patientProvisioned, provisionError, needsClinicianSelection, retryProvisioning]);

  const signUp: AuthContextValue['signUp'] = async ({ email, password, name, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });
    return { error: error?.message ?? null, userId: data.user?.id ?? null, hasSession: !!data.session };
  };

  const signIn: AuthContextValue['signIn'] = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const recordConsent = async (consentType: ConsentType, granted: boolean) => {
    if (!session?.user.id) return { error: 'Not signed in' };
    const { error } = await supabase.from('consents').insert({
      profile_id: session.user.id,
      consent_type: consentType,
      granted,
    });
    if (!error) setConsents((prev) => ({ ...prev, [consentType]: granted }));
    return { error: error?.message ?? null };
  };

  const refreshProfile = useCallback(
    async (userId?: string) => {
      const id = userId ?? session?.user.id;
      if (!id) return;
      await loadProfileAndConsents(id);
    },
    [session, loadProfileAndConsents],
  );

  return (
    <AuthContext.Provider
      value={{
        loading,
        session,
        profile,
        consents,
        patientProvisioned,
        provisionError,
        needsClinicianSelection,
        hasClinician,
        signUp,
        signIn,
        signOut,
        recordConsent,
        retryProvisioning,
        selectClinician,
        continueWithoutClinician,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
