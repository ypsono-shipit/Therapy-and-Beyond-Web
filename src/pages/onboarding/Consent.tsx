import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { Switch } from '../../components/ui';

const STEPS = ['Purpose', 'Consent', 'Agree'];

export default function Consent() {
  const { recordConsent, signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [aiConsent, setAiConsent] = useState(true);
  const [policyChecked, setPolicyChecked] = useState(false);
  const [sensitiveDataChecked, setSensitiveDataChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = step !== 2 || (policyChecked && sensitiveDataChecked);

  const handleContinue = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    setError(null);
    const results = await Promise.all([
      recordConsent('checkin_data_sharing', true),
      recordConsent('ai_transcription', aiConsent),
      recordConsent('privacy_policy', true),
      recordConsent('sensitive_data_processing', true),
    ]);
    setSubmitting(false);
    const failed = results.find((r) => r.error);
    if (failed) setError(failed.error);
  };

  return (
    <div className="auth-panel" style={{ minHeight: '100vh' }}>
      <div className="auth-card">
        <div className="row space-between" style={{ marginBottom: 20 }}>
          <button type="button" onClick={() => (step === 0 ? signOut() : setStep(step - 1))}>
            ←
          </button>
          <div className="row">
            {STEPS.map((s, i) => (
              <span
                key={s}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === step ? 'var(--burgundy)' : i < step ? 'var(--sage)' : 'var(--border)',
                }}
              />
            ))}
          </div>
          <span />
        </div>

        {step === 0 && (
          <>
            <div className="card" style={{ width: 56, height: 56, display: 'grid', placeItems: 'center', marginBottom: 16 }}>
              <ShieldCheck color="var(--burgundy)" />
            </div>
            <h1 className="page-title" style={{ fontSize: 24 }}>
              Before you begin
            </h1>
            <p className="page-sub">
              Your daily check-ins (mood, energy, sleep, medication, events, and optional voice notes) are collected only
              to help your clinician prepare for your sessions.
            </p>
            <div className="stack" style={{ marginTop: 18 }}>
              <div className="card">
                <strong>This data is shared exclusively with your clinician</strong>
                <p className="muted" style={{ margin: '8px 0 0' }}>
                  It is never used for marketing or research, and is never shared with any third party.
                </p>
              </div>
              <div className="card">
                <strong>Purpose limitation</strong>
                <p className="muted" style={{ margin: '8px 0 0' }}>
                  We collect this data solely to generate your clinician&apos;s pre-session brief and support continuity of
                  care between appointments.
                </p>
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="page-title" style={{ fontSize: 24 }}>
              Your consent, in detail
            </h1>
            <p className="page-sub">Review what you&apos;re sharing. You can change these later in Settings.</p>
            <div className="stack" style={{ marginTop: 18 }}>
              <div className="card">
                <strong>Share check-in data with your clinician</strong>
                <p className="muted">Required to use Therapy & Beyond.</p>
              </div>
              <div className="card row space-between">
                <div>
                  <strong>AI transcription & theme extraction</strong>
                  <p className="muted" style={{ margin: '6px 0 0' }}>
                    AI summarises themes from your voice notes. It does not diagnose.
                  </p>
                </div>
                <Switch on={aiConsent} onToggle={() => setAiConsent(!aiConsent)} />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="page-title" style={{ fontSize: 24 }}>
              Agree to continue
            </h1>
            <div className="stack" style={{ marginTop: 18 }}>
              <label className="card row" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={policyChecked} onChange={(e) => setPolicyChecked(e.target.checked)} />
                <span>
                  I have read the <Link to="/privacy">Privacy Policy</Link>
                </span>
              </label>
              <label className="card row" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={sensitiveDataChecked} onChange={(e) => setSensitiveDataChecked(e.target.checked)} />
                <span>I consent to processing of sensitive health data for my care</span>
              </label>
            </div>
          </>
        )}

        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 24 }} disabled={!canContinue || submitting} onClick={handleContinue}>
          {submitting ? 'Saving…' : step < 2 ? 'Continue' : 'Agree and continue'}
        </button>
      </div>
    </div>
  );
}
