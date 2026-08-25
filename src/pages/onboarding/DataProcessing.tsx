import { useState } from 'react';
import { useAuth } from '../../context/AuthProvider';

const RESPONSIBILITIES = [
  { who: 'Your practice (Data Controller)', points: ['Determines how and why patient data is used', 'Obtains patient consent for treatment', 'Retains primary responsibility under PDPA & HCSA'] },
  { who: 'Therapy & Beyond (Data Intermediary)', points: ['Processes data only on your instructions', 'Applies encryption, access controls & audit logging', 'Never uses patient data for its own purposes'] },
];

export default function DataProcessing() {
  const { recordConsent, signOut } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="auth-panel" style={{ minHeight: '100vh', alignItems: 'flex-start' }}>
      <div className="auth-card" style={{ paddingTop: 48 }}>
        <h1 className="page-title" style={{ fontSize: 24 }}>
          Data Processing Agreement
        </h1>
        <p className="page-sub">
          Therapy & Beyond acts as your Data Intermediary. Your practice remains the Data Controller and retains
          primary responsibility for patient data under Singapore&apos;s PDPA and the Healthcare Services Act (HCSA).
        </p>
        <div className="stack" style={{ marginTop: 18 }}>
          {RESPONSIBILITIES.map((r) => (
            <div key={r.who} className="card">
              <strong>{r.who}</strong>
              <ul>
                {r.points.map((p) => (
                  <li key={p} className="muted">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <button type="button" className="linkish" style={{ margin: '12px 0', background: 'none' }} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Hide' : 'View'} full DPA terms
        </button>
        {expanded && (
          <div className="card">
            <p className="muted">
              Patient data is processed exclusively to deliver the Therapy & Beyond platform to your practice: structured
              check-ins, voice journal transcription, AI-assisted theme extraction, and secure messaging. Data is encrypted
              at rest and in transit, hosted in Singapore, and access-controlled per user role with full audit logging.
            </p>
          </div>
        )}
        <label className="card row" style={{ marginTop: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>I accept this Data Processing Agreement on behalf of my practice.</span>
        </label>
        {error && <p className="error">{error}</p>}
        <button
          className="btn btn-sage"
          style={{ width: '100%', marginTop: 16 }}
          disabled={!accepted || submitting}
          onClick={async () => {
            setSubmitting(true);
            const { error: consentError } = await recordConsent('dpa_acceptance', true);
            setSubmitting(false);
            if (consentError) setError(consentError);
          }}
        >
          {submitting ? 'Saving…' : 'Accept DPA'}
        </button>
        <button className="btn" style={{ width: '100%', marginTop: 8 }} onClick={() => signOut()}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
