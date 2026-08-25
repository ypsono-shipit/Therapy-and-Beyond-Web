import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { usePatients } from '../../hooks/usePatients';
import { useAlerts } from '../../hooks/useAlerts';
import { useClinicianSettings, useUpdateClinicianSettings, type ClinicianSettings } from '../../hooks/useMyClinician';
import { uploadAvatar } from '../../hooks/useAvatarUpload';
import { FALLBACK_CLINICIAN_AVATAR } from '../../types';
import { Spinner } from '../../components/ui';

function OfficeHoursForm({ clinicianId, settings }: { clinicianId: string; settings: ClinicianSettings }) {
  const updateSettings = useUpdateClinicianSettings(clinicianId);
  const [hours, setHours] = useState(settings.officeHours);
  const [tz, setTz] = useState(settings.officeHoursTz);
  const [note, setNote] = useState(settings.officeHoursNote);
  const [saved, setSaved] = useState(false);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <strong>Office hours</strong>
      <p className="muted">Patients see this on their home screen.</p>
      <label className="label">Hours</label>
      <textarea
        className="textarea"
        placeholder="Mon–Fri 9:00–17:00 SGT"
        value={hours}
        onChange={(e) => {
          setHours(e.target.value);
          setSaved(false);
        }}
      />
      <label className="label" style={{ marginTop: 10 }}>
        Timezone
      </label>
      <input
        className="input"
        value={tz}
        placeholder="Asia/Singapore"
        onChange={(e) => {
          setTz(e.target.value);
          setSaved(false);
        }}
      />
      <label className="label" style={{ marginTop: 10 }}>
        Note
      </label>
      <textarea
        className="textarea"
        placeholder="Closed public holidays. Message for urgent matters."
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setSaved(false);
        }}
      />
      {updateSettings.isError && <p className="error">{(updateSettings.error as Error).message}</p>}
      {saved && !updateSettings.isPending && <p className="muted">Saved.</p>}
      <button
        className="btn btn-sage"
        style={{ marginTop: 12 }}
        disabled={updateSettings.isPending}
        onClick={() => {
          updateSettings.mutate(
            { officeHours: hours, officeHoursTz: tz, officeHoursNote: note },
            { onSuccess: () => setSaved(true) },
          );
        }}
      >
        {updateSettings.isPending ? 'Saving…' : 'Save hours'}
      </button>
    </div>
  );
}

export default function ClinicianProfile() {
  const { session, profile, signOut, refreshProfile } = useAuth();
  const clinicianId = session?.user.id;
  const { data: patients = [] } = usePatients();
  const { data: alerts = [] } = useAlerts();
  const unresolved = alerts.filter((a) => !a.resolved);
  const [uploading, setUploading] = useState(false);
  const { data: settings } = useClinicianSettings(clinicianId);

  if (!profile) return <Spinner />;

  return (
    <div className="page">
      <h1 className="page-title">Profile</h1>
      <div className="card" style={{ textAlign: 'center', margin: '16px 0' }}>
        <label style={{ cursor: 'pointer' }}>
          <img className="avatar avatar-lg" src={profile.avatar_url ?? FALLBACK_CLINICIAN_AVATAR} alt="" />
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !clinicianId) return;
              setUploading(true);
              try {
                await uploadAvatar(clinicianId, file);
                await refreshProfile(clinicianId);
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
        <h2>{profile.name}</h2>
        <p className="muted">{profile.email}</p>
        {uploading && <p className="muted">Uploading…</p>}
      </div>
      <div className="grid grid-2">
        <div className="card">
          <div style={{ fontSize: 24, fontWeight: 800 }}>{patients.length}</div>
          <div className="muted">Patients</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 24, fontWeight: 800 }}>{unresolved.length}</div>
          <div className="muted">Open alerts</div>
        </div>
      </div>
      {clinicianId && settings && <OfficeHoursForm clinicianId={clinicianId} settings={settings} />}
      <div className="stack" style={{ marginTop: 16 }}>
        <Link className="card" to="/privacy">
          Privacy Policy
        </Link>
        <button className="btn btn-danger" onClick={() => signOut()}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
