import { useState } from 'react';
import { useAuth } from '../../context/AuthProvider';

export default function WaitingInvite() {
  const { retryProvisioning, signOut, provisionError } = useAuth();
  const [checking, setChecking] = useState(false);

  return (
    <div className="auth-panel" style={{ minHeight: '100vh' }}>
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1 className="page-title" style={{ fontSize: 24 }}>
          Waiting for your clinician
        </h1>
        <p className="page-sub">
          Your account is set up, but your clinician hasn&apos;t invited you yet. Ask them to send an invite to the email
          you signed up with, then tap Check again.
        </p>
        {provisionError && <p className="error">{provisionError}</p>}
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 20 }}
          disabled={checking}
          onClick={async () => {
            setChecking(true);
            await retryProvisioning();
            setChecking(false);
          }}
        >
          {checking ? 'Checking…' : 'Check again'}
        </button>
        <button className="btn" style={{ width: '100%', marginTop: 8 }} onClick={() => signOut()}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
