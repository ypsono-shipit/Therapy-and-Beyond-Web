import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bell, Calendar, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { usePatients } from '../../hooks/usePatients';
import { useAlerts } from '../../hooks/useAlerts';
import { useUpcomingSessionsCount } from '../../hooks/useSessions';
import { useCheckIns } from '../../hooks/useCheckIns';
import { supabase, readFunctionError } from '../../lib/supabase';
import { Modal, Spinner } from '../../components/ui';
import { FALLBACK_AVATAR, type Alert, type Patient } from '../../types';
import { patientRiskLevel, type RiskLevel } from '../../lib/risk';

function riskChipStyle(level: RiskLevel): { background: string; color: string } {
  if (level === 'urgent') return { background: 'var(--danger)', color: 'var(--white)' };
  if (level === 'high') return { background: 'var(--danger-dim)', color: 'var(--danger)' };
  if (level === 'moderate') return { background: 'var(--warning-dim)', color: 'var(--warning)' };
  if (level === 'low') return { background: 'var(--sage-dim)', color: 'var(--sage)' };
  return { background: 'var(--surface)', color: 'var(--muted)' };
}

function PatientCard({ patient, alerts }: { patient: Patient; alerts: Alert[] }) {
  const { data: checkIns } = useCheckIns(patient.id);
  const last7 = (checkIns ?? []).filter((c) => Date.now() - new Date(c.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000);
  const rate = Math.round((last7.length / 7) * 100);
  const last = checkIns?.[0];
  const risk = patientRiskLevel(alerts);
  const alertCount = alerts.filter((a) => !a.resolved).length;
  return (
    <div className="card row">
      <Link to={`/clinic/patients/${patient.id}`} state={{ patient }} className="row" style={{ flex: 1, textDecoration: 'none', minWidth: 0 }}>
        <img className="avatar" src={patient.avatar || FALLBACK_AVATAR} alt="" />
        <div style={{ flex: 1 }}>
          <div className="row space-between">
            <strong>{patient.name}</strong>
            <span className="row" style={{ gap: 6 }}>
              <span className="pill" style={riskChipStyle(risk)}>
                {risk === 'none' ? 'No risk' : risk.charAt(0).toUpperCase() + risk.slice(1)}
              </span>
              {alertCount > 0 && (
                <span className="pill" style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}>
                  {alertCount} alert{alertCount > 1 ? 's' : ''}
                </span>
              )}
            </span>
          </div>
          <div className="muted">
            {patient.age} · {patient.gender} · {patient.demographics.occupation}
          </div>
          <div className="muted">
            {patient.streakDays}d streak{last ? ` · Mood ${last.mood}/10` : ''} · {rate}% 7-day
          </div>
        </div>
      </Link>
      <Link to={`/clinic/patients/${patient.id}/briefing`} state={{ patient }} className="btn btn-sm btn-ghost" style={{ flexShrink: 0 }}>
        Brief
      </Link>
    </div>
  );
}

export default function Dashboard() {
  const { session, profile } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const { data: patients = [], isLoading } = usePatients();
  const { data: alerts = [] } = useAlerts();
  const { data: upcomingCount = 0 } = useUpcomingSessionsCount();
  const unresolved = alerts.filter((a) => !a.resolved);
  const high = unresolved.filter((a) => a.severity === 'high' || a.severity === 'urgent');

  const sendInvite = async () => {
    if (!session?.user.id || !inviteEmail.trim()) return;
    setSending(true);
    setInviteMsg(null);
    const { error } = await supabase.functions.invoke('send-patient-invite', {
      body: { email: inviteEmail.trim().toLowerCase() },
    });
    setSending(false);
    if (error) {
      setInviteMsg(await readFunctionError(error));
      return;
    }
    setInviteEmail('');
    setInviteOpen(false);
    setInviteMsg('Invite sent.');
  };

  return (
    <div className="page wide">
      <div className="page-header">
        <div>
          <div className="muted">Dashboard</div>
          <h1 className="page-title">{profile?.name ?? '…'}</h1>
        </div>
        <button className="btn btn-sage" onClick={() => setInviteOpen(true)}>
          <UserPlus size={18} /> Invite patient
        </button>
      </div>

      <div className="card" style={{ marginBottom: 14, background: 'var(--sage-dim)' }}>
        Patient data is processed on your behalf under our Data Processing Agreement. Your practice controls clinical use
        and retention.
      </div>

      {high.length > 0 && (
        <Link to="/clinic/alerts" className="card row space-between" style={{ marginBottom: 14, textDecoration: 'none', background: 'var(--danger-dim)' }}>
          <strong>
            {high.length} high-priority alert{high.length > 1 ? 's' : ''}
          </strong>
          <span>Immediate review required</span>
        </Link>
      )}

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: 'Patients', value: patients.length, icon: Users, color: 'var(--burgundy)' },
          { label: 'Alerts', value: unresolved.length, icon: Bell, color: 'var(--danger)' },
          { label: 'Sessions', value: upcomingCount, icon: Calendar, color: 'var(--sage)' },
        ].map((s) => (
          <div key={s.label} className="card">
            <s.icon color={s.color} size={20} />
            <div style={{ fontSize: 28, fontWeight: 800 }}>{s.value}</div>
            <div className="muted">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 16 }}>Patients</h2>
      {inviteMsg && <p className="muted">{inviteMsg}</p>}
      {isLoading && <Spinner />}
      {!isLoading && patients.length === 0 && <p className="empty">No patients yet — invite one to get started.</p>}
      <div className="stack" style={{ marginTop: 12 }}>
        {patients.map((p) => (
          <PatientCard key={p.id} patient={p} alerts={alerts.filter((a) => a.patient_id === p.id)} />
        ))}
      </div>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)}>
        <h3>Invite a patient</h3>
        <p className="muted">They&apos;ll be linked to you as soon as they sign up (or sign in) with this email.</p>
        <input className="input" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="patient@example.com" />
        {inviteMsg && <p className="error">{inviteMsg}</p>}
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setInviteOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-sage" style={{ flex: 1 }} disabled={sending} onClick={sendInvite}>
            {sending ? 'Sending…' : 'Send Invite'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
