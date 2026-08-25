import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthProvider';
import { useClinicianDirectory } from '../../hooks/useClinicianDirectory';
import { FALLBACK_CLINICIAN_AVATAR } from '../../types';
import { Spinner } from '../../components/ui';

export default function SelectClinician({ later = false }: { later?: boolean }) {
  const { selectClinician, continueWithoutClinician, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [skipping, setSkipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: clinicians = [], isLoading } = useClinicianDirectory(search);

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    setError(null);
    const { error: selectError } = await selectClinician(id);
    if (selectError) {
      setError(selectError);
      setSelectedId(null);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['my_clinician'] });
    if (later) navigate('/app/profile');
  };

  const handleSkip = async () => {
    setSkipping(true);
    setError(null);
    const { error: skipError } = await continueWithoutClinician();
    setSkipping(false);
    if (skipError) setError(skipError);
  };

  return (
    <div className="auth-panel" style={{ minHeight: later ? undefined : '100vh', alignItems: 'flex-start' }}>
      <div className="auth-card" style={{ paddingTop: later ? 0 : 48 }}>
        <h1 className="page-title" style={{ fontSize: 24 }}>
          {later ? 'Find your clinician' : 'Who’s treating you?'}
        </h1>
        <p className="page-sub">
          {later
            ? 'Search for the clinician who’s treating you to link your account. They’ll be able to see your check-ins and Chat Buddy summaries.'
            : 'Search for your clinician if you have one. If you don’t, you can still use daily check-ins and Chat Buddy on your own.'}
        </p>
        <input className="input" style={{ marginTop: 18 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name…" />
        {error && <p className="error">{error}</p>}
        {isLoading ? (
          <Spinner />
        ) : (
          <div className="stack" style={{ marginTop: 16 }}>
            {clinicians.length === 0 && (
              <p className="empty">{search.trim() ? 'No clinicians found matching that name.' : 'No clinicians are registered yet.'}</p>
            )}
            {clinicians.map((c) => (
              <button
                key={c.id}
                type="button"
                className="card row"
                style={{ width: '100%', textAlign: 'left' }}
                disabled={selectedId !== null || skipping}
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
        {!later && (
          <button type="button" className="btn btn-primary" style={{ marginTop: 24, width: '100%' }} disabled={skipping || selectedId !== null} onClick={handleSkip}>
            {skipping ? 'Continuing…' : 'Continue without a clinician'}
          </button>
        )}
        <p className="muted" style={{ textAlign: 'center', marginTop: 10, fontSize: 13 }}>
          {later ? 'You can stay unlinked and keep using check-ins and Chat Buddy.' : 'You can link a clinician later from your profile.'}
        </p>
        {later ? (
          <button type="button" className="btn" style={{ marginTop: 8, width: '100%' }} onClick={() => navigate('/app/profile')}>
            Back to profile
          </button>
        ) : (
          <button type="button" className="btn" style={{ marginTop: 8, width: '100%' }} onClick={() => signOut()}>
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}
