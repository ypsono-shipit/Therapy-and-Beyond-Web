import { useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { hasCheckedInToday, useCheckIns, useSubmitCheckIn } from '../../hooks/useCheckIns';
import { Switch } from '../../components/ui';

const MOOD_LABELS = ['', 'Very Low', 'Low', 'Below Avg', 'Fair-Low', 'Fair', 'Moderate', 'Good', 'Very Good', 'Great', 'Excellent'];
const SLEEP_OPTIONS = ['Poor', 'Fair', 'Good', 'Excellent'] as const;

function SliderRow({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div className="card">
      <div className="row space-between" style={{ marginBottom: 12 }}>
        <strong>{label}</strong>
        <span className="pill" style={{ background: value >= 7 ? 'var(--success-dim)' : value >= 4 ? 'var(--warning-dim)' : 'var(--danger-dim)', color: value >= 7 ? 'var(--success)' : value >= 4 ? 'var(--warning)' : 'var(--danger)' }}>
          {value} · {MOOD_LABELS[value]}
        </span>
      </div>
      <div className="dot-row">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button key={n} type="button" className={`dot ${n === value ? 'on' : ''}`} style={{ background: n <= value ? color : 'var(--border)' }} onClick={() => onChange(n)} />
        ))}
      </div>
      <div className="row space-between" style={{ marginTop: 6 }}>
        <span className="muted" style={{ fontSize: 12 }}>
          1 — {label === 'Anxiety' ? 'None' : 'Very Low'}
        </span>
        <span className="muted" style={{ fontSize: 12 }}>
          10 — {label === 'Anxiety' ? 'Severe' : 'Excellent'}
        </span>
      </div>
    </div>
  );
}

export default function CheckIn() {
  const { session } = useAuth();
  const { data: checkIns } = useCheckIns(session?.user.id);
  const submitCheckIn = useSubmitCheckIn(session?.user.id);
  const [mood, setMood] = useState(5);
  const [anxiety, setAnxiety] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [sleepQuality, setSleepQuality] = useState<(typeof SLEEP_OPTIONS)[number]>('Fair');
  const [medTaken, setMedTaken] = useState(false);
  const [event, setEvent] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const already = hasCheckedInToday(checkIns);
  const todayEntry = checkIns?.find((c) => new Date(c.timestamp).toDateString() === new Date().toDateString());

  if (!submitted && already) {
    return (
      <div className="page empty">
        <h1 className="page-title">Already checked in today</h1>
        <p className="page-sub">
          {todayEntry?.source === 'voice_journal'
            ? "We logged today's check-in automatically from your voice journal entry. Come back tomorrow."
            : "You've completed today's check-in. Come back tomorrow for your next one."}
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="page empty">
        <h1 className="page-title">Check-in complete</h1>
        <p className="page-sub">Your progress has been logged and is now visible to your clinician.</p>
        <button className="btn btn-primary" onClick={() => setSubmitted(false)}>
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Daily Check-In</h1>
      <p className="page-sub">A few minutes to reflect on how you&apos;re feeling today.</p>
      <div className="stack" style={{ marginTop: 8 }}>
        <SliderRow label="Mood" value={mood} onChange={setMood} color="var(--sage)" />
        <SliderRow label="Anxiety" value={anxiety} onChange={setAnxiety} color="var(--danger)" />
        <SliderRow label="Energy" value={energy} onChange={setEnergy} color="var(--gold)" />
        <div className="card">
          <span className="label">Sleep</span>
          <div className="row" style={{ marginBottom: 14 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSleep(Math.max(0, sleep - 0.5))}>
              −
            </button>
            <strong style={{ fontSize: 24, color: 'var(--burgundy)', minWidth: 64, textAlign: 'center' }}>{sleep}h</strong>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSleep(Math.min(12, sleep + 0.5))}>
              +
            </button>
          </div>
          <span className="label">Sleep Quality</span>
          <div className="row">
            {SLEEP_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className="btn btn-sm"
                style={{ flex: 1, background: sleepQuality === opt ? 'var(--burgundy)' : 'var(--surface)', color: sleepQuality === opt ? 'white' : 'var(--charcoal)' }}
                onClick={() => setSleepQuality(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="card row space-between">
          <div>
            <span className="label">Medication Taken</span>
            <div className="muted">Did you take your prescribed medication today?</div>
          </div>
          <Switch on={medTaken} onToggle={() => setMedTaken(!medTaken)} />
        </div>
        <div className="card">
          <label className="label">Any significant event today?</label>
          <input className="input" value={event} onChange={(e) => setEvent(e.target.value)} placeholder="e.g. difficult meeting, social event..." />
        </div>
        <div className="card">
          <label className="label">Additional notes</label>
          <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How are you feeling?" />
        </div>
        {submitCheckIn.isError && <p className="error">{(submitCheckIn.error as Error).message}</p>}
        <button
          className="btn btn-primary"
          disabled={submitCheckIn.isPending}
          onClick={() =>
            submitCheckIn.mutate(
              { mood, anxiety, energy, sleepDuration: sleep, sleepQuality, medicationTaken: medTaken, significantEvent: event, notes },
              { onSuccess: () => setSubmitted(true) },
            )
          }
        >
          {submitCheckIn.isPending ? 'Submitting…' : 'Submit Check-In'}
        </button>
        <p className="muted" style={{ textAlign: 'center' }}>
          Shared only with your clinician, to prepare for your sessions.
        </p>
      </div>
    </div>
  );
}
