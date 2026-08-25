import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { usePatientRecord } from '../../hooks/usePatients';
import { useMyClinician } from '../../hooks/useMyClinician';
import { useCheckIns } from '../../hooks/useCheckIns';
import { uploadAvatar } from '../../hooks/useAvatarUpload';
import { FALLBACK_AVATAR, FALLBACK_CLINICIAN_AVATAR } from '../../types';
import { Spinner } from '../../components/ui';

export default function Profile() {
  const { session, profile, signOut, refreshProfile } = useAuth();
  const patientId = session?.user.id;
  const { data: patient, isLoading } = usePatientRecord(patientId);
  const { data: clinician } = useMyClinician(patientId);
  const { data: checkIns } = useCheckIns(patientId);
  const [uploading, setUploading] = useState(false);

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
      {clinician && (
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
      )}
      <div className="card" style={{ marginTop: 14 }}>
        <strong>Activity</strong>
        <p>
          {patient.streakDays} day streak · {checkIns?.length ?? 0} check-ins
        </p>
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
