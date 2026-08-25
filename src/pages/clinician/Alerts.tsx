import { useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useAlerts, useRateAlert, useResolveAlert } from '../../hooks/useAlerts';
import { usePatients } from '../../hooks/usePatients';
import { Spinner } from '../../components/ui';
import { normalizeSeverity, rank, type NormalizedSeverity } from '../../lib/risk';
import type { Alert, AlertType, Patient } from '../../types';

type Filter = 'all' | NormalizedSeverity;

const FILTERS: Filter[] = ['all', 'low', 'moderate', 'high', 'urgent'];

const TYPE_LABELS: Record<AlertType, string> = {
  mood_drop: 'Mood drop',
  missed_med: 'Missed medication',
  anxiety_spike: 'Anxiety spike',
  missed_checkin: 'Missed check-in',
  ai_chat_flag: 'AI chat flag',
  risk_warning: 'Risk warning',
  sleep_mood: 'Sleep & mood',
  work_stress: 'Work stress',
  isolation: 'Isolation',
  med_pattern: 'Medication pattern',
};

const PATTERN_TYPES: AlertType[] = ['risk_warning', 'sleep_mood', 'work_stress', 'isolation', 'med_pattern'];

function typeLabel(type: AlertType): string {
  return TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function pillStyle(severity: NormalizedSeverity): { background: string; color: string } {
  if (severity === 'urgent' || severity === 'high') {
    return { background: 'var(--danger-dim)', color: 'var(--danger)' };
  }
  if (severity === 'moderate') {
    return { background: 'var(--warning-dim)', color: 'var(--warning)' };
  }
  return { background: 'var(--sage-dim)', color: 'var(--sage)' };
}

function cardAccent(severity: NormalizedSeverity): CSSProperties {
  if (severity === 'urgent') {
    return { borderLeft: '6px solid var(--danger)', background: 'var(--danger-dim)' };
  }
  if (severity === 'high') {
    return { borderLeft: '4px solid var(--danger)', background: 'var(--danger-dim)' };
  }
  if (severity === 'moderate') {
    return { borderLeft: '4px solid var(--warning)' };
  }
  return { borderLeft: '4px solid var(--border)', opacity: 0.92 };
}

function AlertCard({ alert, patient }: { alert: Alert; patient?: Patient }) {
  const rateAlert = useRateAlert();
  const resolveAlert = useResolveAlert();
  const [rating, setRating] = useState<number | null>(alert.clinicianRating ?? null);
  const [feedback, setFeedback] = useState(alert.clinicianFeedback ?? '');
  const [noise, setNoise] = useState(Boolean(alert.dismissedAsNoise));
  const severity = normalizeSeverity(alert.severity);
  const pill = pillStyle(severity);

  const submitRating = () => {
    if (rating == null) return;
    rateAlert.mutate({
      alertId: alert.id,
      rating,
      feedback: feedback.trim() || null,
      noise,
    });
  };

  return (
    <div className="card" style={cardAccent(severity)}>
      <div className="row space-between">
        <strong>{alert.patientName}</strong>
        <span className="pill" style={pill}>
          {severity.toUpperCase()}
        </span>
      </div>
      <div className="row space-between" style={{ marginTop: 4 }}>
        <span className="muted">{typeLabel(alert.type)}</span>
        <span className="muted">{formatTime(alert.timestamp)}</span>
      </div>
      <p style={{ margin: '10px 0' }}>{alert.message}</p>

      {alert.resolved ? (
        <div className="muted" style={{ fontSize: 13 }}>
          Resolved
          {alert.clinicianRating != null ? ` · rated ${alert.clinicianRating}/5` : ''}
          {alert.dismissedAsNoise ? ' · false positive' : ''}
          {alert.clinicianFeedback ? ` · “${alert.clinicianFeedback}”` : ''}
        </div>
      ) : (
        <div className="stack" style={{ gap: 10 }}>
          <div>
            <span className="label">Rate this warning</span>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`btn btn-sm ${rating === n ? 'btn-sage' : 'btn-ghost'}`}
                  onClick={() => setRating(n)}
                  title={n === 1 ? 'Noise / over-sensitive' : n === 5 ? 'True crisis' : `${n}`}
                  style={{ minWidth: 40 }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              1 = noise / over-sensitive · 5 = true crisis
            </div>
          </div>
          <textarea
            className="textarea"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Optional feedback (what was useful or missed)"
            style={{ minHeight: 72 }}
          />
          <label className="row" style={{ fontSize: 13, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={noise}
              onChange={(e) => {
                const checked = e.target.checked;
                setNoise(checked);
                if (checked && rating == null) setRating(1);
              }}
            />
            False positive / too sensitive
          </label>
          {rateAlert.isError && <p className="error">Couldn&apos;t save rating. Try again.</p>}
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {patient && (
              <Link className="btn btn-ghost btn-sm" to={`/clinic/patients/${patient.id}`} state={{ patient }}>
                View Patient
              </Link>
            )}
            <button
              className="btn btn-sage btn-sm"
              disabled={rating == null || rateAlert.isPending}
              onClick={submitRating}
            >
              {rateAlert.isPending ? 'Saving…' : 'Rate & close'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              disabled={resolveAlert.isPending}
              onClick={() => resolveAlert.mutate(alert.id)}
            >
              Resolve
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Alerts() {
  const { data: alerts = [], isLoading } = useAlerts();
  const { data: patients = [] } = usePatients();
  const [filter, setFilter] = useState<Filter>('all');

  const unresolved = useMemo(
    () =>
      alerts
        .filter((a) => !a.resolved)
        .sort((a, b) => rank(b.severity) - rank(a.severity) || +new Date(b.timestamp) - +new Date(a.timestamp)),
    [alerts],
  );
  const resolved = useMemo(
    () => alerts.filter((a) => a.resolved).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)),
    [alerts],
  );

  const matches = (a: Alert) => filter === 'all' || normalizeSeverity(a.severity) === filter;
  const shownOpen = unresolved.filter(matches);
  const shownResolved = resolved.filter(matches);
  const patternInsights = unresolved.filter((a) => PATTERN_TYPES.includes(a.type));

  const countFor = (f: Filter) =>
    f === 'all' ? unresolved.length : unresolved.filter((a) => normalizeSeverity(a.severity) === f).length;

  if (isLoading) return <Spinner />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Risk inbox</h1>
          <p className="page-sub">Ratings teach the model which warnings were useful.</p>
        </div>
      </div>

      <div className="tabs" style={{ margin: '0 0 16px' }}>
        {FILTERS.map((f) => (
          <button key={f} type="button" className={`tab sage ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f} ({countFor(f)})
          </button>
        ))}
      </div>

      {patternInsights.length > 0 && filter === 'all' && (
        <div className="card" style={{ marginBottom: 14, background: 'var(--gold-dim)' }}>
          <strong>Pattern insights</strong>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            {patternInsights.length} pattern-based flag{patternInsights.length > 1 ? 's' : ''} in the inbox
            {['sleep_mood', 'work_stress', 'isolation', 'med_pattern', 'risk_warning']
              .filter((t) => patternInsights.some((a) => a.type === t))
              .map((t) => ` · ${typeLabel(t as AlertType)}`)
              .join('')}
            . Rate them so the model learns which were useful.
          </p>
        </div>
      )}

      {shownOpen.length === 0 && <p className="empty">All clear — no active alerts.</p>}
      <div className="stack">
        {shownOpen.map((a) => (
          <AlertCard key={a.id} alert={a} patient={patients.find((p) => p.id === a.patient_id)} />
        ))}
      </div>

      {shownResolved.length > 0 && (
        <>
          <h2 style={{ fontSize: 15, marginTop: 24 }}>Resolved</h2>
          <div className="stack">
            {shownResolved.slice(0, 12).map((a) => (
              <AlertCard key={a.id} alert={a} patient={patients.find((p) => p.id === a.patient_id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
