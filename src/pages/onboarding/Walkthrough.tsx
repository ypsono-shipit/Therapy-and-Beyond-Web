import { useState } from 'react';
import { Heart, Mic, TrendingUp, Lock, LayoutGrid, Bell, Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';

const PATIENT_STEPS = [
  { icon: Heart, title: 'Welcome to Therapy & Beyond', body: "Track how you're feeling, journal by voice, and talk with Chat Buddy — with a clinician if you have one, or on your own if you don't." },
  { icon: Heart, title: 'Daily Check-In', body: 'Log your mood, anxiety, energy, sleep, and medication once a day. If you link a clinician later, they can see this to prepare for your next session.' },
  { icon: Mic, title: 'Voice Journal', body: "Record a short voice note about how you're feeling. It's transcribed privately, and can automatically fill in that day's check-in for you." },
  { icon: TrendingUp, title: 'Progress', body: 'See your mood and streak trends over time, and revisit past check-ins and journal entries.' },
  { icon: Lock, title: 'Your data, your control', body: 'Review or withdraw consent any time from Profile. Check-ins stay yours until you link a clinician — then they’re shared only with that clinician.' },
];

const CLINICIAN_STEPS = [
  { icon: LayoutGrid, title: 'Welcome to Therapy & Beyond', body: "This app helps you keep track of patients between sessions. Here's a quick look at what you can do." },
  { icon: LayoutGrid, title: 'Dashboard', body: 'See your patient roster, check-in streaks, and open alerts at a glance. Tap a patient for their full history.' },
  { icon: Bell, title: 'Alerts', body: "You're notified when a check-in or voice journal suggests something needs attention, prioritised by severity." },
  { icon: Sparkles, title: 'AI Clinical Summary', body: "Each patient's page includes an AI-generated summary of recent check-ins and journal themes — a starting point for your review, not a clinical decision." },
  { icon: UserPlus, title: 'Inviting patients', body: 'Use Invite on your Dashboard to link a new patient to your practice by email.' },
];

export default function Walkthrough() {
  const { profile, completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const steps = profile?.role === 'clinician' ? CLINICIAN_STEPS : PATIENT_STEPS;
  const current = steps[step];
  const Icon = current.icon;

  const finish = async () => {
    if (!profile?.id) return;
    setSaving(true);
    const { error: updateError } = await completeOnboarding();
    if (updateError) {
      setSaving(false);
      setError(updateError);
      return;
    }
    setSaving(false);
  };

  return (
    <div className="auth-panel" style={{ minHeight: '100vh' }}>
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="row" style={{ justifyContent: 'center', marginBottom: 16 }}>
          {steps.map((s, i) => (
            <span
              key={s.title}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: i === step ? 'var(--burgundy)' : 'var(--border)',
              }}
            />
          ))}
        </div>
        <div className="card" style={{ width: 72, height: 72, display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
          <Icon color="var(--burgundy)" size={28} />
        </div>
        <h1 className="page-title" style={{ fontSize: 24 }}>
          {current.title}
        </h1>
        <p className="page-sub">{current.body}</p>
        {error && <p className="error">{error}</p>}
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 28 }}
          disabled={saving}
          onClick={() => (step < steps.length - 1 ? setStep(step + 1) : finish())}
        >
          {saving ? 'Saving…' : step < steps.length - 1 ? 'Next' : 'Get started'}
        </button>
      </div>
    </div>
  );
}
