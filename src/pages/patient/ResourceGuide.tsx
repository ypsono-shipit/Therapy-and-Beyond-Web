import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Pause, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { getResource, type ResourceStep } from '../../data/resources';
import { useAddHelpfulStrategy } from '../../hooks/useSafety';

type Phase = 'inhale' | 'hold' | 'exhale' | 'holdAfter';

const PHASE_LABEL: Record<Phase, string> = {
  inhale: 'Breathe in',
  hold: 'Hold',
  exhale: 'Breathe out',
  holdAfter: 'Hold empty',
};

function BreatheStep({
  step,
  onDone,
}: {
  step: Extract<ResourceStep, { kind: 'breathe' }>;
  onDone: () => void;
}) {
  const sequence = useMemo(() => {
    const items: { phase: Phase; seconds: number }[] = [
      { phase: 'inhale', seconds: step.inhale },
      { phase: 'hold', seconds: step.hold },
      { phase: 'exhale', seconds: step.exhale },
      { phase: 'holdAfter', seconds: step.holdAfter },
    ];
    return items.filter((p) => p.seconds > 0);
  }, [step]);

  const [round, setRound] = useState(0);
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(sequence[0]?.seconds ?? 0);
  const [running, setRunning] = useState(true);
  const finished = useRef(false);
  const current = sequence[idx] ?? sequence[0];
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    finished.current = false;
    setRound(0);
    setIdx(0);
    setLeft(sequence[0]?.seconds ?? 0);
    setRunning(true);
  }, [sequence, step.title]);

  useEffect(() => {
    if (!running || !current) return;
    const t = window.setInterval(() => {
      setLeft((s) => {
        if (s > 1) return s - 1;
        const nextIdx = idx + 1;
        if (nextIdx < sequence.length) {
          setIdx(nextIdx);
          return sequence[nextIdx].seconds;
        }
        const nextRound = round + 1;
        if (nextRound < step.rounds) {
          setRound(nextRound);
          setIdx(0);
          return sequence[0].seconds;
        }
        if (!finished.current) {
          finished.current = true;
          window.setTimeout(() => onDoneRef.current(), 400);
        }
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [running, current, idx, round, sequence, step.rounds]);

  const scale =
    current?.phase === 'inhale' ? 1 : current?.phase === 'exhale' ? 0.72 : current?.phase === 'hold' ? 1 : 0.72;

  return (
    <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
      <div
        style={{
          width: 168,
          height: 168,
          margin: '12px auto 20px',
          borderRadius: 40,
          background: 'var(--burgundy-dim)',
          border: '4px solid var(--burgundy)',
          transform: `scale(${scale})`,
          transition: `transform ${Math.max(current?.seconds ?? 1, 1)}s ease-in-out`,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--burgundy)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {current ? PHASE_LABEL[current.phase] : 'Done'}
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--charcoal)' }}>{left}</div>
        </div>
      </div>
      <p className="muted">
        Round {Math.min(round + 1, step.rounds)} of {step.rounds}
      </p>
      <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setRunning((v) => !v)}>
        {running ? <Pause size={16} /> : <Play size={16} />}
        {running ? 'Pause' : 'Resume'}
      </button>
    </div>
  );
}

function TimerStep({
  step,
  onDone,
}: {
  step: Extract<ResourceStep, { kind: 'timer' }>;
  onDone: () => void;
}) {
  const [left, setLeft] = useState(step.seconds);
  const [running, setRunning] = useState(true);
  const [released, setReleased] = useState(false);

  useEffect(() => {
    setLeft(step.seconds);
    setRunning(true);
    setReleased(false);
  }, [step]);

  useEffect(() => {
    if (!running || released) return;
    const t = window.setInterval(() => {
      setLeft((s) => {
        if (s > 1) return s - 1;
        setReleased(true);
        setRunning(false);
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [running, released]);

  return (
    <div style={{ textAlign: 'center' }}>
      <p>{step.body}</p>
      <div style={{ fontSize: 48, fontWeight: 800, margin: '16px 0' }}>{left}s</div>
      {released && step.cue && <p style={{ fontWeight: 600 }}>{step.cue}</p>}
      {!released && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRunning((v) => !v)}>
          {running ? 'Pause' : 'Resume'}
        </button>
      )}
      {released && (
        <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={onDone}>
          Continue
        </button>
      )}
    </div>
  );
}

function ScanStep({ step, onDone }: { step: Extract<ResourceStep, { kind: 'scan' }>; onDone: () => void }) {
  const [i, setI] = useState(0);
  const region = step.regions[i];
  const [left, setLeft] = useState(region?.seconds ?? 0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const finished = useRef(false);

  useEffect(() => {
    finished.current = false;
    setI(0);
    setLeft(step.regions[0]?.seconds ?? 0);
  }, [step]);

  useEffect(() => {
    if (!region) return;
    const t = window.setInterval(() => {
      setLeft((s) => {
        if (s > 1) return s - 1;
        const next = i + 1;
        if (next >= step.regions.length) {
          if (!finished.current) {
            finished.current = true;
            window.setTimeout(() => onDoneRef.current(), 300);
          }
          return 0;
        }
        setI(next);
        return step.regions[next].seconds;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [region, i, step.regions]);

  if (!region) return null;
  const pct = ((i + (region.seconds - left) / region.seconds) / step.regions.length) * 100;

  return (
    <div>
      <p className="muted">{step.body}</p>
      <div style={{ height: 6, background: 'var(--surface)', borderRadius: 99, margin: '16px 0', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--burgundy)' }} />
      </div>
      <h3 style={{ fontSize: 22, margin: '12px 0 4px' }}>{region.name}</h3>
      <p className="muted">{left}s</p>
    </div>
  );
}

export default function ResourceGuide() {
  const { id } = useParams();
  const navigate = useNavigate();
  const resource = getResource(id);
  const { session } = useAuth();
  const addStrategy = useAddHelpfulStrategy(session?.user.id);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStepIndex(0);
    setAnswers({});
    setChecked({});
    setDone(false);
    setSaved(false);
  }, [id]);

  if (!resource) return <Navigate to="/app/resources" replace />;

  const step = resource.steps[stepIndex];
  const total = resource.steps.length;
  const progress = done ? 100 : ((stepIndex + 0.15) / total) * 100;

  const goNext = useCallback(() => {
    setStepIndex((s) => {
      if (s >= total - 1) {
        setDone(true);
        return s;
      }
      return s + 1;
    });
  }, [total]);

  const goBack = () => {
    if (done) {
      setDone(false);
      return;
    }
    if (stepIndex === 0) navigate('/app/resources');
    else setStepIndex((s) => s - 1);
  };

  const saveWorked = async () => {
    await addStrategy.mutateAsync(resource.title);
    setSaved(true);
  };

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <button type="button" className="muted" style={{ fontWeight: 600, marginBottom: 12 }} onClick={goBack}>
        <span className="row" style={{ display: 'inline-flex', gap: 6 }}>
          <ArrowLeft size={16} /> {stepIndex === 0 && !done ? 'Resources' : 'Back'}
        </span>
      </button>

      <div className="row space-between" style={{ marginBottom: 8 }}>
        <span className="pill" style={{ background: 'var(--burgundy-dim)', color: 'var(--burgundy)' }}>
          {resource.type}
        </span>
        <span className="muted">{resource.duration}</span>
      </div>
      <h1 className="page-title" style={{ fontSize: 24 }}>
        {resource.title}
      </h1>
      <div style={{ height: 6, background: 'var(--surface)', borderRadius: 99, margin: '14px 0 20px', overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--burgundy)', transition: 'width 0.2s ease' }} />
      </div>

      {done ? (
        <div className="card stack">
          <h2 style={{ margin: 0 }}>You finished</h2>
          <p className="muted">{resource.close}</p>
          {Object.keys(answers).length > 0 && (
            <div>
              <strong>Your notes</strong>
              <div className="stack" style={{ marginTop: 8 }}>
                {resource.steps.map((s, i) =>
                  answers[i] ? (
                    <div key={i}>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {s.title}
                      </div>
                      <div>{answers[i]}</div>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          )}
          <button className="btn btn-primary" type="button" disabled={saved || addStrategy.isPending} onClick={() => void saveWorked()}>
            {saved ? (
              <>
                <Check size={16} /> Saved to What worked
              </>
            ) : (
              'Save to What worked for me'
            )}
          </button>
          <Link className="btn btn-ghost" to="/app/resources">
            Back to resources
          </Link>
        </div>
      ) : (
        <div className="card">
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
            Step {stepIndex + 1} of {total}
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>{step.title}</h2>
          {stepIndex === 0 && <p className="muted">{resource.intro}</p>}

          {step.kind === 'read' && <p>{step.body}</p>}

          {step.kind === 'prompt' && (
            <>
              <p>{step.body}</p>
              {step.multiline ? (
                <textarea
                  className="textarea"
                  style={{ marginTop: 12 }}
                  placeholder={step.placeholder}
                  value={answers[stepIndex] ?? ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, [stepIndex]: e.target.value }))}
                />
              ) : (
                <input
                  className="input"
                  style={{ marginTop: 12 }}
                  placeholder={step.placeholder}
                  value={answers[stepIndex] ?? ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, [stepIndex]: e.target.value }))}
                />
              )}
            </>
          )}

          {step.kind === 'check' && (
            <>
              <p>{step.body}</p>
              <div className="stack" style={{ marginTop: 12 }}>
                {step.items.map((item) => (
                  <label key={item} className="row" style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
                    <input
                      type="checkbox"
                      checked={!!checked[item]}
                      onChange={(e) => setChecked((c) => ({ ...c, [item]: e.target.checked }))}
                      style={{ marginTop: 3 }}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          {step.kind === 'breathe' && <BreatheStep step={step} onDone={goNext} />}
          {step.kind === 'timer' && <TimerStep step={step} onDone={goNext} />}
          {step.kind === 'scan' && <ScanStep step={step} onDone={goNext} />}

          {step.kind !== 'breathe' && step.kind !== 'scan' && !(step.kind === 'timer') && (
            <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={goNext}>
              {stepIndex === total - 1 ? 'Finish' : 'Next'}
            </button>
          )}
          {step.kind === 'timer' ? null : step.kind === 'breathe' || step.kind === 'scan' ? (
            <button type="button" className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={goNext}>
              Skip this step
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
