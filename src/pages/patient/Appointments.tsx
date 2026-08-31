import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { useSessions } from '../../hooks/useSessions';
import { useMyClinician } from '../../hooks/useMyClinician';
import { FALLBACK_CLINICIAN_AVATAR } from '../../types';

export default function Appointments() {
  const { session, hasClinician } = useAuth();
  const { data: sessions = [] } = useSessions(session?.user.id);
  const { data: clinician } = useMyClinician(session?.user.id);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const upcoming = sessions.filter((s) => s.status === 'scheduled');
  const past = sessions.filter((s) => s.status !== 'scheduled');
  const shown = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="page">
      <h1 className="page-title">Appointments</h1>
      {!hasClinician && (
        <div className="card" style={{ margin: '16px 0' }}>
          <p className="muted">Appointments show up here once you link a clinician.</p>
          <Link className="btn btn-primary" to="/app/find-clinician" style={{ marginTop: 8 }}>
            Find a clinician
          </Link>
        </div>
      )}
      {clinician && (
        <div className="card row" style={{ margin: '16px 0' }}>
          <img className="avatar" src={clinician.avatar ?? FALLBACK_CLINICIAN_AVATAR} alt="" />
          <div style={{ flex: 1 }}>
            <strong>{clinician.name}</strong>
            <div className="muted">{clinician.title}</div>
            <div className="muted">{clinician.clinic}</div>
          </div>
        </div>
      )}
      <div className="tabs">
        {(['upcoming', 'past'] as const).map((t) => (
          <button key={t} type="button" className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t} ({t === 'upcoming' ? upcoming.length : past.length})
          </button>
        ))}
      </div>
      <div className="stack" style={{ marginTop: 14 }}>
        {shown.length === 0 && <p className="empty">No {tab} sessions</p>}
        {shown.map((s) => (
          <div key={s.id} className="card">
            <div className="row space-between">
              <div>
                <strong>
                  {s.date} · {s.time}
                </strong>
                <div className="muted">{s.type}</div>
              </div>
              <span className="pill" style={{ background: s.status === 'scheduled' ? 'var(--burgundy-dim)' : s.status === 'completed' ? 'var(--sage-dim)' : 'var(--danger-dim)', color: s.status === 'scheduled' ? 'var(--burgundy)' : s.status === 'completed' ? 'var(--sage)' : 'var(--danger)' }}>
                {s.status}
              </span>
            </div>
            {s.notes && <p className="muted">{s.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
