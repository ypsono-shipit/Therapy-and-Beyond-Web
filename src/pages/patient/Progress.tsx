import { useState } from 'react';
import { Flame, CheckCircle2, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { useCheckIns } from '../../hooks/useCheckIns';
import { usePatientRecord } from '../../hooks/usePatients';
import { Spinner } from '../../components/ui';

export default function Progress() {
  const { session } = useAuth();
  const patientId = session?.user.id;
  const { data: checkInsDesc, isLoading } = useCheckIns(patientId);
  const { data: patient } = usePatientRecord(patientId);
  const [active, setActive] = useState<'mood' | 'anxiety' | 'energy'>('mood');
  const myCheckins = [...(checkInsDesc ?? [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const metrics = {
    mood: { label: 'Mood', color: 'var(--sage)', data: myCheckins.map((c) => c.mood) },
    anxiety: { label: 'Anxiety', color: 'var(--danger)', data: myCheckins.map((c) => c.anxiety) },
    energy: { label: 'Energy', color: 'var(--gold)', data: myCheckins.map((c) => c.energy) },
  };
  const metric = metrics[active];
  const avg = (arr: number[]) => (arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '—');

  if (isLoading) return <Spinner />;
  if (myCheckins.length === 0) {
    return (
      <div className="page empty">
        <p>No check-ins yet — your progress will appear here once you start checking in.</p>
      </div>
    );
  }

  const w = 640;
  const h = 120;
  const points = metric.data.map((v, i) => {
    const x = metric.data.length > 1 ? (i / (metric.data.length - 1)) * w : w / 2;
    const y = h - (v / 10) * h;
    return `${x},${y}`;
  });

  return (
    <div className="page">
      <h1 className="page-title">Progress</h1>
      <div className="grid grid-3" style={{ margin: '16px 0' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <Flame color="var(--gold)" />
          <div style={{ fontSize: 24, fontWeight: 800 }}>{patient?.streakDays ?? 0}</div>
          <div className="muted">Day streak</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <CheckCircle2 color="var(--sage)" />
          <div style={{ fontSize: 24, fontWeight: 800 }}>{myCheckins.length}</div>
          <div className="muted">Check-ins</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <Heart color="var(--burgundy)" />
          <div style={{ fontSize: 24, fontWeight: 800 }}>{avg(myCheckins.map((c) => c.mood))}</div>
          <div className="muted">Avg mood</div>
        </div>
      </div>
      <div className="tabs">
        {(Object.keys(metrics) as Array<keyof typeof metrics>).map((k) => (
          <button key={k} type="button" className={`tab ${active === k ? 'active' : ''}`} onClick={() => setActive(k)}>
            {metrics[k].label}
          </button>
        ))}
      </div>
      <div className="card" style={{ marginTop: 14, overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="140">
          <polyline fill="none" stroke={metric.color} strokeWidth="3" points={points.join(' ')} />
          {metric.data.map((v, i) => {
            const x = metric.data.length > 1 ? (i / (metric.data.length - 1)) * w : w / 2;
            const y = h - (v / 10) * h;
            return <circle key={i} cx={x} cy={y} r="5" fill={metric.color} />;
          })}
        </svg>
      </div>
      <div className="stack" style={{ marginTop: 16 }}>
        {[...myCheckins].reverse().slice(0, 10).map((c) => (
          <div key={c.id} className="card row space-between">
            <span>{new Date(c.timestamp).toLocaleDateString()}</span>
            <span className="muted">
              M:{c.mood} A:{c.anxiety} E:{c.energy}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
