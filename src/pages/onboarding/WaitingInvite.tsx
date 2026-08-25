import { useState } from 'react';
import { useAuth } from '../../context/AuthProvider';

export default function WaitingInvite() {
  const { retryProvisioning, continueWithoutClinician, signOut, provisionError } = useAuth();
  const [checking, setChecking] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [skipError, setSkipError] = useState<string | null>(null);

  return (
    <div className="auth-panel" style={{ minHeight: '100vh' }}>
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1 className="page-title" style={{ fontSize: 24 }}>
          Waiting for your clinician
        </h1>
        <p className="page-sub">
          Your account is set up, but your clinician hasn&apos;t invited you yet. You can wait for an invite, or continue
          on your own with daily check-ins and Chat Buddy.
        </p>
        {provisionError && <p className="error">{provisionError}</p>}
        {skipError && <p className="error">{skipError}</p>}
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 20 }}
          disabled={checking || skipping}
          onClick={async () => {
            setSkipping(true);
            setSkipError(null);
            const { error } = await continueWithoutClinician();
            setSkipping(false);
            if (error) setSkipError(error);
          }}
        >
          {skipping ? 'Continuing…' : 'Continue without a clinician'}
        </button>
        <button
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: 8 }}
          disabled={checking || skipping}
          onClick={async () => {
            setChecking(true);
            await retryProvisioning();
            setChecking(false);
          }}
        >
          {checking ? 'Checking…' : 'Check for an invite'}
        </button>
        <button className="btn" style={{ width: '100%', marginTop: 8 }} onClick={() => signOut()}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
