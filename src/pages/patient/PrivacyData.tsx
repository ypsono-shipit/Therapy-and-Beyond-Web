import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { useMyClinician } from '../../hooks/useMyClinician';
import { Switch } from '../../components/ui';

const DATA_COLLECTED = [
  'Mood, anxiety & energy check-ins',
  'Sleep duration & quality',
  'Medication adherence',
  'Voice journal recordings & AI transcripts',
];

export default function PrivacyData() {
  const { session, consents, recordConsent } = useAuth();
  const { data: clinician } = useMyClinician(session?.user.id);
  const aiConsent = consents.ai_transcription ?? false;

  return (
    <div className="page">
      <h1 className="page-title">Your Data & Privacy</h1>
      <div className="stack" style={{ marginTop: 16 }}>
        <div className="card">
          <strong>What we collect</strong>
          <ul>
            {DATA_COLLECTED.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <strong>Who can see my data?</strong>
          <p className="muted">
            Only you and <strong>{clinician?.name ?? 'your clinician'}</strong>. Therapy & Beyond does not use your data for
            marketing or research.
          </p>
        </div>
        <div className="card row space-between">
          <div>
            <strong>AI transcription & theme extraction</strong>
            <p className="muted">AI summarises themes from your voice notes for your clinician. It does not diagnose.</p>
          </div>
          <Switch on={aiConsent} onToggle={() => void recordConsent('ai_transcription', !aiConsent)} />
        </div>
        <Link className="card" to="/privacy">
          Read the full Privacy Policy
        </Link>
      </div>
    </div>
  );
}
