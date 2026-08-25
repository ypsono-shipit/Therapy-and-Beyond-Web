import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthProvider';
import { hasCheckedInToday, useCheckIns, useSubmitCheckIn } from '../../hooks/useCheckIns';
import { MoodBar, Switch } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import {
  cadenceGuidance,
  daysLoggedThisWeek,
  suggestedCadence,
} from '../../lib/consistency';

const MOOD_LABELS = ['', 'Very Low', 'Low', 'Below Avg', 'Fair-Low', 'Fair', 'Moderate', 'Good', 'Very Good', 'Great', 'Excellent'];
const SLEEP_OPTIONS = ['Poor', 'Fair', 'Good', 'Excellent'] as const;
const COPING_PRESETS = ['Breathing', 'Grounding', 'Walk', 'Journaling', 'Talked to someone', 'Music', 'Meditation', 'Rest'];
const CYCLE_PHASES = ['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'];

function SliderRow({
  label,
  value,
  onChange,
  color,
  low = 'Very Low',
  high = 'Excellent',
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  color: string;
  low?: string;
  high?: string;
}) {
  const n = value ?? 0;
  const pillLabel = n ? `${n} · ${MOOD_LABELS[n] || n}` : 'Optional';
  return (
    <div className="card">
      <div className="row space-between" style={{ marginBottom: 12 }}>
        <strong>{label}</strong>
        <span
          className="pill"
          style={{
            background: n >= 7 ? 'var(--success-dim)' : n >= 4 ? 'var(--warning-dim)' : n ? 'var(--danger-dim)' : 'var(--surface)',
            color: n >= 7 ? 'var(--success)' : n >= 4 ? 'var(--warning)' : n ? 'var(--danger)' : 'var(--muted)',
          }}
        >
          {pillLabel}
        </span>
      </div>
      <div className="dot-row">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <button
            key={i}
            type="button"
            className={`dot ${i === n ? 'on' : ''}`}
            style={{ background: n && i <= n ? color : 'var(--border)' }}
            onClick={() => onChange(i)}
          />
        ))}
      </div>
      <div className="row space-between" style={{ marginTop: 6 }}>
        <span className="muted" style={{ fontSize: 12 }}>
          1 — {low}
        </span>
        <span className="muted" style={{ fontSize: 12 }}>
          10 — {high}
        </span>
      </div>
    </div>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="pill"
      onClick={onClick}
      style={{
        background: selected ? 'var(--burgundy)' : 'var(--surface)',
        color: selected ? 'white' : 'var(--charcoal)',
        height: 32,
        padding: '0 12px',
        fontSize: 13,
      }}
    >
      {label}
    </button>
  );
}

export default function CheckIn() {
  const { session } = useAuth();
  const patientId = session?.user.id;
  const { data: checkIns } = useCheckIns(patientId);
  const submitCheckIn = useSubmitCheckIn(patientId);
  const { data: cycleOptIn } = useQuery({
    queryKey: ['patients', patientId, 'cycle_tracking_opt_in'],
    queryFn: async () => {
      const { data, error } = await supabase.from('patients').select('cycle_tracking_opt_in').eq('id', patientId).single();
      if (error) throw error;
      return Boolean((data as { cycle_tracking_opt_in: boolean }).cycle_tracking_opt_in);
    },
    enabled: !!patientId,
  });

  const [mood, setMood] = useState(5);
  const [anxiety, setAnxiety] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [sleepQuality, setSleepQuality] = useState<(typeof SLEEP_OPTIONS)[number]>('Fair');
  const [medTaken, setMedTaken] = useState(false);
  const [event, setEvent] = useState('');
  const [notes, setNotes] = useState('');
  const [appetite, setAppetite] = useState<number | null>(null);
  const [functioning, setFunctioning] = useState<number | null>(null);
  const [stressors, setStressors] = useState('');
  const [wins, setWins] = useState('');
  const [copingUsed, setCopingUsed] = useState<string[]>([]);
  const [customCoping, setCustomCoping] = useState('');
  const [cyclePhase, setCyclePhase] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loggingAnother, setLoggingAnother] = useState(false);

  const cadence = suggestedCadence(checkIns);
  const daysThisWeek = daysLoggedThisWeek(checkIns);
  const alreadyToday = hasCheckedInToday(checkIns);
  const todayEntry = checkIns?.find((c) => new Date(c.timestamp).toDateString() === new Date().toDateString());
  const daysAfterSubmit = alreadyToday ? daysThisWeek : Math.min(7, daysThisWeek + 1);

  function resetOptional() {
    setMood(5);
    setAnxiety(5);
    setEnergy(5);
    setSleep(7);
    setSleepQuality('Fair');
    setMedTaken(false);
    setEvent('');
    setNotes('');
    setAppetite(null);
    setFunctioning(null);
    setStressors('');
    setWins('');
    setCopingUsed([]);
    setCustomCoping('');
    setCyclePhase('');
    setShowMore(false);
  }

  function startAnother() {
    resetOptional();
    setSubmitted(false);
    setLoggingAnother(true);
  }

  function toggleCoping(label: string) {
    setCopingUsed((prev) => (prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]));
  }

  function addCustomCoping() {
    const value = customCoping.trim();
    if (!value) return;
    if (!copingUsed.includes(value)) setCopingUsed((prev) => [...prev, value]);
    setCustomCoping('');
  }

  if (submitted) {
    return (
      <div className="page empty">
        <h1 className="page-title">You showed up today</h1>
        <p className="page-sub">
          Logged {daysAfterSubmit} {daysAfterSubmit === 1 ? 'day' : 'days'} this week. Showing up is what counts.
        </p>
        <div className="stack" style={{ marginTop: 16, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
          <button className="btn btn-primary" onClick={startAnother}>
            Log another check-in
          </button>
          <button className="btn btn-ghost" onClick={() => setSubmitted(false)}>
            Done
          </button>
        </div>
      </div>
    );
  }

  if (!loggingAnother && todayEntry) {
    return (
      <div className="page">
        <h1 className="page-title">You showed up today</h1>
        <p className="page-sub">
          Logged {daysThisWeek} {daysThisWeek === 1 ? 'day' : 'days'} this week. {cadenceGuidance(cadence)}
        </p>
        <div className="card" style={{ marginTop: 16 }}>
          <div className="row" style={{ marginBottom: 12 }}>
            <strong>Today&apos;s latest</strong>
            {todayEntry.source === 'voice_journal' && (
              <span className="pill" style={{ marginLeft: 'auto', background: 'var(--gold-dim)', color: 'var(--gold)' }}>
                via Voice Journal
              </span>
            )}
          </div>
          <MoodBar label="Mood" value={todayEntry.mood} color="var(--sage)" />
          <MoodBar label="Anxiety" value={todayEntry.anxiety} color="var(--danger)" />
          <MoodBar label="Energy" value={todayEntry.energy} color="var(--gold)" />
          <p className="muted" style={{ marginTop: 12 }}>
            {new Date(todayEntry.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            {todayEntry.sleepDuration != null ? ` · ${todayEntry.sleepDuration}h ${todayEntry.sleepQuality}` : ''}
          </p>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 16, width: '100%' }} onClick={startAnother}>
          Log another check-in
        </button>
        <Link to="/app/safety" className="card" style={{ display: 'block', textDecoration: 'none', marginTop: 14 }}>
          <strong>Safety plan</strong>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Build yours when you feel stable — not during a crisis.
          </p>
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Check-In</h1>
      <p className="page-sub">{cadenceGuidance(cadence)}</p>
      <div className="stack" style={{ marginTop: 8 }}>
        <SliderRow label="Mood" value={mood} onChange={setMood} color="var(--sage)" />
        <SliderRow
          label="Anxiety"
          value={anxiety}
          onChange={setAnxiety}
          color="var(--danger)"
          low="None"
          high="Severe"
        />
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
        <button type="button" className="btn btn-ghost" onClick={() => setShowMore((v) => !v)}>
          {showMore ? 'Less' : 'More (optional)'}
        </button>
        {showMore && (
          <>
            <SliderRow
              label="Appetite"
              value={appetite}
              onChange={setAppetite}
              color="var(--gold)"
              low="None"
              high="Very hungry"
            />
            <SliderRow
              label="Functioning"
              value={functioning}
              onChange={setFunctioning}
              color="var(--sage)"
              low="Struggling"
              high="Fully able"
            />
            <div className="card">
              <label className="label">Stressors</label>
              <input className="input" value={stressors} onChange={(e) => setStressors(e.target.value)} placeholder="What felt heavy today?" />
            </div>
            <div className="card">
              <label className="label">Wins</label>
              <input className="input" value={wins} onChange={(e) => setWins(e.target.value)} placeholder="Anything that went okay, however small" />
            </div>
            <div className="card">
              <span className="label">Coping used</span>
              <div className="row" style={{ flexWrap: 'wrap', marginBottom: 10 }}>
                {[...COPING_PRESETS, ...copingUsed.filter((c) => !COPING_PRESETS.includes(c))].map((opt) => (
                  <Chip key={opt} label={opt} selected={copingUsed.includes(opt)} onClick={() => toggleCoping(opt)} />
                ))}
              </div>
              <div className="row">
                <input
                  className="input"
                  value={customCoping}
                  onChange={(e) => setCustomCoping(e.target.value)}
                  placeholder="Add your own"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomCoping();
                    }
                  }}
                />
                <button type="button" className="btn btn-ghost btn-sm" onClick={addCustomCoping}>
                  Add
                </button>
              </div>
            </div>
            {cycleOptIn && (
              <div className="card">
                <span className="label">Cycle phase</span>
                <div className="row" style={{ flexWrap: 'wrap' }}>
                  {CYCLE_PHASES.map((opt) => (
                    <Chip
                      key={opt}
                      label={opt}
                      selected={cyclePhase === opt}
                      onClick={() => setCyclePhase(cyclePhase === opt ? '' : opt)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {submitCheckIn.isError && <p className="error">{(submitCheckIn.error as Error).message}</p>}
        <button
          className="btn btn-primary"
          disabled={submitCheckIn.isPending}
          onClick={() =>
            submitCheckIn.mutate(
              {
                mood,
                anxiety,
                energy,
                sleepDuration: sleep,
                sleepQuality,
                medicationTaken: medTaken,
                significantEvent: event,
                notes,
                appetite,
                functioning,
                copingUsed,
                wins,
                stressors,
                cyclePhase: cycleOptIn ? cyclePhase : '',
              },
              {
                onSuccess: () => {
                  setSubmitted(true);
                  setLoggingAnother(false);
                },
              },
            )
          }
        >
          {submitCheckIn.isPending ? 'Submitting…' : 'Submit Check-In'}
        </button>
        <p className="muted" style={{ textAlign: 'center' }}>
          Shared only with your clinician, to prepare for your sessions.
        </p>
        <Link to="/app/safety" className="card" style={{ textDecoration: 'none' }}>
          <strong>Safety plan</strong>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Build yours when you feel stable — not during a crisis.
          </p>
        </Link>
      </div>
    </div>
  );
}
