import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthProvider';
import { usePatientRecord } from '../../hooks/usePatients';
import { useMyClinician } from '../../hooks/useMyClinician';
import { useCheckIns } from '../../hooks/useCheckIns';
import { uploadAvatar } from '../../hooks/useAvatarUpload';
import { FALLBACK_AVATAR, FALLBACK_CLINICIAN_AVATAR } from '../../types';
import { Spinner, Switch } from '../../components/ui';
import { supabase } from '../../lib/supabase';

export default function Profile() {
  const { session, profile, signOut, refreshProfile } = useAuth();
  const patientId = session?.user.id;
  const { data: patient, isLoading } = usePatientRecord(patientId);
  const { data: clinician } = useMyClinician(patientId);
  const { data: checkIns } = useCheckIns(patientId);
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [savingCycle, setSavingCycle] = useState(false);
  const [cycleError, setCycleError] = useState<string | null>(null);
  const cycleQueryKey = ['patients', patientId, 'cycle_tracking_opt_in'] as const;
  const { data: cycleOptIn } = useQuery({
    queryKey: cycleQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase.from('patients').select('cycle_tracking_opt_in').eq('id', patientId).single();
      if (error) throw error;
      return Boolean((data as { cycle_tracking_opt_in: boolean }).cycle_tracking_opt_in);
    },
    enabled: !!patientId,
  });

  async function toggleCycleTracking() {
    if (!patientId || savingCycle) return;
    const next = !cycleOptIn;
    setSavingCycle(true);
    setCycleError(null);
    queryClient.setQueryData(cycleQueryKey, next);
    try {
      const { error } = await supabase.from('patients').update({ cycle_tracking_opt_in: next }).eq('id', patientId);
      if (error) throw error;
    } catch (e) {
      queryClient.setQueryData(cycleQueryKey, !next);
      setCycleError(e instanceof Error ? e.message : 'Could not update cycle tracking.');
    } finally {
      setSavingCycle(false);
    }
  }

  if (isLoading || !patient || !profile) return <Spinner />;
  const d = patient.demographics;

  return (
    <div className="page">
      <h1 className="page-title">Profile</h1>
      <div className="card" style={{ textAlign: 'center', margin: '16px 0' }}>
        <label style={{ cursor: 'pointer' }}>
          <img className="avatar avatar-lg" src={profile.avatar_url ?? FALLBACK_AVATAR} alt="" />
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !patientId) return;
              setUploading(true);
              try {
                await uploadAvatar(patientId, file);
                await refreshProfile(patientId);
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
        <h2 style={{ margin: '12px 0 4px' }}>{profile.name}</h2>
        <p className="muted">
          {d.pronouns} · {d.occupation}
        </p>
        {uploading && <p className="muted">Uploading…</p>}
      </div>
      <div className="card">
        <strong>Contact</strong>
        <p>Phone: {d.phone || '—'}</p>
        <p>Email: {profile.email}</p>
        <p>Emergency: {d.emergencyContact || '—'}</p>
      </div>
      {clinician ? (
        <div className="card" style={{ marginTop: 14 }}>
          <strong>My Clinician</strong>
          <div className="row" style={{ marginTop: 10 }}>
            <img className="avatar" src={clinician.avatar ?? FALLBACK_CLINICIAN_AVATAR} alt="" />
            <div>
              <div>{clinician.name}</div>
              <div className="muted">{clinician.title}</div>
              <div className="muted">{clinician.clinic}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 14 }}>
          <strong>No clinician linked</strong>
          <p className="muted">You&apos;re using check-ins and Chat Buddy on your own. Link a clinician anytime if you start therapy.</p>
          <Link className="btn btn-primary" to="/app/find-clinician" style={{ marginTop: 8 }}>
            Find a clinician
          </Link>
        </div>
      )}
      <div className="card" style={{ marginTop: 14 }}>
        <strong>Activity</strong>
        <p>
          {patient.streakDays} day streak · {checkIns?.length ?? 0} check-ins
        </p>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="row space-between">
          <div style={{ paddingRight: 12 }}>
            <strong>Menstrual cycle tracking</strong>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              Optional. If you turn this on, daily check-ins include a cycle-phase chip (menstrual, follicular,
              ovulatory, luteal) so patterns with mood, sleep, or anxiety can be spotted later. Off by default, never
              required, and only you and a linked clinician would see it.
            </p>
          </div>
          <Switch on={Boolean(cycleOptIn)} onToggle={() => void toggleCycleTracking()} />
        </div>
        {savingCycle && <p className="muted" style={{ margin: '8px 0 0' }}>Saving…</p>}
        {cycleError && <p className="error">{cycleError}</p>}
      </div>
      <div className="stack" style={{ marginTop: 14 }}>
        <Link className="card" to="/app/privacy-data" style={{ textDecoration: 'none' }}>
          Your Data & Privacy
        </Link>
        <Link className="card" to="/privacy" style={{ textDecoration: 'none' }}>
          Privacy Policy
        </Link>
        <button className="btn btn-danger" onClick={() => signOut()}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
