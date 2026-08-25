import { useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useClinicianDirectory } from '../../hooks/useClinicianDirectory';
import { FALLBACK_CLINICIAN_AVATAR } from '../../types';
import { Spinner } from '../../components/ui';

export default function SelectClinician() {
  const { selectClinician, signOut } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: clinicians = [], isLoading } = useClinicianDirectory(search);

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    setError(null);
    const { error: selectError } = await selectClinician(id);
    if (selectError) {
      setError(selectError);
      setSelectedId(null);
    }
  };

  return (
    <div className="auth-panel" style={{ minHeight: '100vh', alignItems: 'flex-start' }}>
      <div className="auth-card" style={{ paddingTop: 48 }}>
        <h1 className="page-title" style={{ fontSize: 24 }}>
          Find your clinician
        </h1>
        <p className="page-sub">Search for the clinician who&apos;s treating you to link your account.</p>
        <input className="input" style={{ marginTop: 18 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name…" />
        {error && <p className="error">{error}</p>}
        {isLoading ? (
          <Spinner />
        ) : (
          <div className="stack" style={{ marginTop: 16 }}>
            {clinicians.length === 0 && <p className="empty">{search.trim() ? 'No clinicians found matching that name.' : 'No clinicians are registered yet.'}</p>}
            {clinicians.map((c) => (
              <button
                key={c.id}
                type="button"
                className="card row"
                style={{ width: '100%', textAlign: 'left' }}
                disabled={selectedId !== null}
                onClick={() => handleSelect(c.id)}
              >
                <img className="avatar" src={c.avatar_url ?? FALLBACK_CLINICIAN_AVATAR} alt="" />
                <div>
                  <strong>{c.name}</strong>
                  <div className="muted">{[c.title, c.clinic].filter(Boolean).join(' · ') || c.email}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        <button type="button" className="btn" style={{ marginTop: 24, width: '100%' }} onClick={() => signOut()}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
