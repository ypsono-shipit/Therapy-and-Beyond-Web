import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAlerts, useResolveAlert } from '../../hooks/useAlerts';
import { usePatients } from '../../hooks/usePatients';
import { Spinner } from '../../components/ui';
import type { AlertSeverity } from '../../types';

export default function Alerts() {
  const { data: alerts = [], isLoading } = useAlerts();
  const { data: patients = [] } = usePatients();
  const resolveAlert = useResolveAlert();
  const [filter, setFilter] = useState<'all' | AlertSeverity>('all');
  const shown = alerts.filter((a) => !a.resolved && (filter === 'all' || a.severity === filter));
  const resolved = alerts.filter((a) => a.resolved);

  if (isLoading) return <Spinner />;

  return (
    <div className="page">
      <h1 className="page-title">Clinical Alerts</h1>
      <div className="tabs" style={{ margin: '16px 0' }}>
        {(['all', 'high', 'medium', 'low'] as const).map((f) => (
          <button key={f} type="button" className={`tab sage ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f} (
            {f === 'all' ? alerts.filter((a) => !a.resolved).length : alerts.filter((a) => !a.resolved && a.severity === f).length})
          </button>
        ))}
      </div>
      {shown.length === 0 && <p className="empty">All clear — no active alerts.</p>}
      <div className="stack">
        {shown.map((a) => {
          const patient = patients.find((p) => p.id === a.patient_id);
          return (
            <div key={a.id} className="card" style={{ borderLeft: `4px solid ${a.severity === 'high' ? 'var(--danger)' : a.severity === 'medium' ? 'var(--warning)' : 'var(--sage)'}` }}>
              <div className="row space-between">
                <strong>{a.patientName}</strong>
                <span className="pill" style={{ background: a.severity === 'high' ? 'var(--danger-dim)' : 'var(--warning-dim)', color: a.severity === 'high' ? 'var(--danger)' : 'var(--warning)' }}>
                  {a.severity.toUpperCase()}
                </span>
              </div>
              <div className="muted">{a.type.replace(/_/g, ' ')}</div>
              <p>{a.message}</p>
              <div className="row">
                {patient && (
                  <Link className="btn btn-ghost btn-sm" to={`/clinic/patients/${patient.id}`} state={{ patient }}>
                    View Patient
                  </Link>
                )}
                <button className="btn btn-sage btn-sm" disabled={resolveAlert.isPending} onClick={() => resolveAlert.mutate(a.id)}>
                  Resolve
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {resolved.length > 0 && (
        <>
          <h2 style={{ fontSize: 15, marginTop: 24 }}>Resolved</h2>
          {resolved.slice(0, 8).map((a) => (
            <div key={a.id} className="muted" style={{ padding: '8px 0' }}>
              {a.patientName}: {a.message}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
