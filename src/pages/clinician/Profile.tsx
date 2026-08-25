import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { usePatients } from '../../hooks/usePatients';
import { useAlerts } from '../../hooks/useAlerts';
import { uploadAvatar } from '../../hooks/useAvatarUpload';
import { FALLBACK_CLINICIAN_AVATAR } from '../../types';
import { Spinner } from '../../components/ui';

export default function ClinicianProfile() {
  const { session, profile, signOut, refreshProfile } = useAuth();
  const clinicianId = session?.user.id;
  const { data: patients = [] } = usePatients();
  const { data: alerts = [] } = useAlerts();
  const unresolved = alerts.filter((a) => !a.resolved);
  const [uploading, setUploading] = useState(false);

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
