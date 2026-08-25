import { useState } from 'react';
import { Flame, CheckCircle2, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { useCheckIns } from '../../hooks/useCheckIns';
import { Spinner } from '../../components/ui';
import {
  daysLoggedThisWeek,
  flexibleStreakWeeks,
  multiWeekTrend,
  weeklyConsistencyPercent,
} from '../../lib/consistency';

function fmtAvg(n: number | null) {
  return n == null ? '—' : n.toFixed(1);
}

export default function Progress() {
  const { session } = useAuth();
  const patientId = session?.user.id;
  const { data: checkInsDesc, isLoading } = useCheckIns(patientId);
  const [active, setActive] = useState<'mood' | 'anxiety' | 'energy'>('mood');
  const myCheckins = [...(checkInsDesc ?? [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const metrics = {
    mood: { label: 'Mood', color: 'var(--sage)', data: myCheckins.map((c) => c.mood) },
    anxiety: { label: 'Anxiety', color: 'var(--danger)', data: myCheckins.map((c) => c.anxiety) },
    energy: { label: 'Energy', color: 'var(--gold)', data: myCheckins.map((c) => c.energy) },
  };
  const metric = metrics[active];
  const avg = (arr: number[]) => (arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '—');
  const daysThisWeek = daysLoggedThisWeek(checkInsDesc);
  const consistencyPct = Math.round(weeklyConsistencyPercent(checkInsDesc));
  const weekStreak = flexibleStreakWeeks(checkInsDesc);
  const trend = multiWeekTrend(checkInsDesc);

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
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {daysThisWeek}/7
          </div>
          <div className="muted">This week · {consistencyPct}%</div>
          {weekStreak > 0 && (
            <div className="muted" style={{ marginTop: 4 }}>
              {weekStreak} {weekStreak === 1 ? 'week' : 'weeks'} of consistency
            </div>
          )}
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
      <div className="card" style={{ marginTop: 14 }}>
        <strong>Recent trends</strong>
        {trend.sentences14.length || trend.sentences28.length ? (
          <>
            {trend.sentences14.map((s) => (
              <p key={s} className="muted" style={{ margin: '6px 0 0' }}>
                {s}
              </p>
            ))}
            {trend.sentences28.map((s) => (
              <p key={s} className="muted" style={{ margin: '6px 0 0' }}>
                {s}
              </p>
            ))}
          </>
        ) : (
          <p className="muted" style={{ margin: '6px 0 0' }}>
            Keep logging — 2- and 4-week comparisons appear once there is enough history.
          </p>
        )}
        <div className="grid grid-3" style={{ marginTop: 12 }}>
          {([
            ['Mood', 'mood'],
            ['Anxiety', 'anxiety'],
            ['Energy', 'energy'],
          ] as const).map(([label, key]) => (
            <div key={key}>
              <div className="label">{label}</div>
              <div>
                14d {fmtAvg(trend.last14[key])}
                <span className="muted"> vs {fmtAvg(trend.prior14[key])}</span>
              </div>
              <div className="muted">
                28d {fmtAvg(trend.last28[key])} vs {fmtAvg(trend.prior28[key])}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="stack" style={{ marginTop: 16 }}>
        {[...myCheckins].reverse().slice(0, 10).map((c) => (
          <div key={c.id} className="card row space-between">
            <span>{new Date(c.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
            <span className="muted">
              M:{c.mood} A:{c.anxiety} E:{c.energy}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
