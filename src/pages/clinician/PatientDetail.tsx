import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { useCheckIns } from '../../hooks/useCheckIns';
import { useSessions, useCreateSession, useUpdateSessionStatus } from '../../hooks/useSessions';
import { useAlerts, useResolveAlert } from '../../hooks/useAlerts';
import { useAuditLog, useLogAuditEvent } from '../../hooks/useAuditLog';
import { useInsight, useGenerateInsight } from '../../hooks/useInsight';
import { useAIChatMessages, useAIChatSummary, useGenerateAIChatSummary } from '../../hooks/useAIChat';
import { usePatients } from '../../hooks/usePatients';
import { useCreateLifeEvent, useDeleteLifeEvent, useLifeEvents, useUpdateLifeEvent } from '../../hooks/useLifeEvents';
import { MoodBar, Modal, Spinner } from '../../components/ui';
import { FALLBACK_AVATAR, type Patient } from '../../types';

const TABS = ['Overview', 'Insights', 'AI Buddy', 'Sessions', 'Alerts', 'Audit Log'] as const;

function localISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function LifeEventsPanel({ patientId }: { patientId: string }) {
  const { data: events = [] } = useLifeEvents(patientId);
  const createEvent = useCreateLifeEvent(patientId);
  const updateEvent = useUpdateLifeEvent(patientId);
  const deleteEvent = useDeleteLifeEvent(patientId);
  const [label, setLabel] = useState('');
  const [date, setDate] = useState(localISODate());
  const [editingId, setEditingId] = useState<string | null>(null);

  const reset = () => {
    setLabel('');
    setDate(localISODate());
    setEditingId(null);
  };

  const save = () => {
    if (!label.trim() || !date) return;
    if (editingId) {
      updateEvent.mutate({ id: editingId, label: label.trim(), occurredOn: date }, { onSuccess: reset });
    } else {
      createEvent.mutate({ label: label.trim(), occurredOn: date }, { onSuccess: reset });
    }
  };

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <strong>Events</strong>
      {events.length === 0 && <p className="muted">No life events yet.</p>}
      {events.map((e) => (
        <div key={e.id} className="row space-between" style={{ padding: '8px 0' }}>
          <div>
            <div>{e.label}</div>
            <div className="muted">{e.occurredOn}</div>
          </div>
          <div className="row">
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setEditingId(e.id);
                setLabel(e.label);
                setDate(e.occurredOn);
              }}
            >
              Edit
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => deleteEvent.mutate(e.id)}>
              Remove
            </button>
          </div>
        </div>
      ))}
      <label className="label" style={{ marginTop: 8 }}>
        {editingId ? 'Edit event' : 'Add event'}
      </label>
      <input className="input" placeholder="started new job" value={label} onChange={(e) => setLabel(e.target.value)} />
      <div className="row" style={{ marginTop: 8 }}>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button type="button" className="btn btn-sm btn-sage" disabled={createEvent.isPending || updateEvent.isPending} onClick={save}>
          {editingId ? 'Update' : 'Add'}
        </button>
        {editingId && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={reset}>
            Cancel
          </button>
        )}
      </div>
      {(createEvent.isError || updateEvent.isError || deleteEvent.isError) && (
        <p className="error">{((createEvent.error || updateEvent.error || deleteEvent.error) as Error).message}</p>
      )}
    </div>
  );
}

export default function PatientDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { session } = useAuth();
  const { data: roster } = usePatients();
  const fromState = (location.state as { patient?: Patient } | null)?.patient;
  const patient = fromState ?? roster?.find((p) => p.id === id);
  const patientId = patient?.id ?? id;
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview');
  const { data: checkins = [], isLoading: checkinsLoading } = useCheckIns(patientId);
  const { data: insight, isLoading: insightLoading } = useInsight(patientId);
  const generateInsight = useGenerateInsight(patientId);
  const { data: aiChatMessages, isLoading: aiChatLoading } = useAIChatMessages(patientId);
  const { data: aiChatSummary } = useAIChatSummary(patientId);
  const generateAIChatSummary = useGenerateAIChatSummary(patientId);
  const { data: sessions = [] } = useSessions(patientId);
  const createSession = useCreateSession(patientId);
  const updateSessionStatus = useUpdateSessionStatus(patientId);
  const { data: alerts = [] } = useAlerts(patientId);
  const resolveAlert = useResolveAlert();
  const { data: auditLog = [] } = useAuditLog(patientId);
  const logAuditEvent = useLogAuditEvent();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [sessionType, setSessionType] = useState<'In-Hand' | 'Telehealth'>('In-Hand');
  const [sessionNotes, setSessionNotes] = useState('');
  const loggedTabsRef = useRef(new Set<string>());

  useEffect(() => {
    if (tab === 'Overview' || tab === 'Audit Log' || !patientId) return;
    if (loggedTabsRef.current.has(tab)) return;
    loggedTabsRef.current.add(tab);
    logAuditEvent.mutate({ patientId, action: `Dr. viewed ${tab} tab` });
  }, [tab, patientId, logAuditEvent]);

  if (!patient) return <Spinner />;

  return (
    <div className="page wide">
      <Link to="/clinic/dashboard" className="muted" style={{ textDecoration: 'none', fontWeight: 600 }}>
        ← Patients
      </Link>
      <div className="page-header" style={{ marginTop: 12 }}>
        <div className="row">
          <img className="avatar" src={patient.avatar || FALLBACK_AVATAR} alt="" />
          <div>
            <h1 className="page-title" style={{ fontSize: 24 }}>
              {patient.name}
            </h1>
            <div className="muted">
              {patient.age} · {patient.gender} · {patient.demographics.occupation}
            </div>
          </div>
        </div>
        <div className="row">
          <Link className="btn btn-ghost" to={`/clinic/messages?patientId=${patient.id}`}>
            Message
          </Link>
          <Link className="btn btn-sage" to={`/clinic/patients/${patient.id}/briefing`} state={{ patient }}>
            Pre-session brief
          </Link>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        {TABS.map((t) => (
          <button key={t} type="button" className={`tab sage ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <>
          {checkinsLoading && <Spinner />}
          <div className="grid grid-3" style={{ marginBottom: 14 }}>
            <div className="card">
              <div style={{ fontWeight: 800 }}>{patient.streakDays}d</div>
              <div className="muted">streak</div>
            </div>
            <div className="card">
              <div style={{ fontWeight: 800 }}>{checkins[0]?.mood ?? '—'}/10</div>
              <div className="muted">mood</div>
            </div>
            <div className="card">
              <div style={{ fontWeight: 800 }}>{checkins.length}</div>
              <div className="muted">check-ins</div>
            </div>
          </div>
          {checkins[0] && (
            <div className="card" style={{ marginBottom: 14 }}>
              <strong>Latest Check-In</strong>
              <p className="muted">{new Date(checkins[0].timestamp).toLocaleString()}</p>
              <MoodBar label="Mood" value={checkins[0].mood} color="var(--sage)" />
              <MoodBar label="Anxiety" value={checkins[0].anxiety} color="var(--danger)" />
              <MoodBar label="Energy" value={checkins[0].energy} color="var(--gold)" />
              {checkins[0].appetite != null && <MoodBar label="Appetite" value={checkins[0].appetite} color="var(--burgundy)" />}
              {checkins[0].functioning != null && <MoodBar label="Function" value={checkins[0].functioning} color="var(--sage)" />}
              <p className="muted">
                {checkins[0].sleepDuration}h · {checkins[0].sleepQuality} · {checkins[0].medicationTaken ? 'Meds taken' : 'Meds missed'}
              </p>
              {checkins[0].significantEvent && <p>Event: {checkins[0].significantEvent}</p>}
              {checkins[0].notes && <p>Notes: {checkins[0].notes}</p>}
            </div>
          )}
          <LifeEventsPanel patientId={patient.id} />
          <div className="card">
            <strong>Check-In History ({checkins.length})</strong>
            {checkins.slice(0, 8).map((c) => (
              <div key={c.id} className="row space-between" style={{ padding: '8px 0' }}>
                <span>{new Date(c.timestamp).toLocaleDateString()}</span>
                <span className="muted">
                  M:{c.mood} A:{c.anxiety} E:{c.energy}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'Insights' && (
        <>
          <button className="btn btn-primary" disabled={generateInsight.isPending} onClick={() => generateInsight.mutate()}>
            {generateInsight.isPending ? 'Generating…' : insight ? 'Refresh AI Insight' : 'Generate AI Insight'}
          </button>
          {generateInsight.isError && <p className="error">{(generateInsight.error as Error).message}</p>}
          {insightLoading && <Spinner />}
          {!insightLoading && !insight && <p className="empty">No AI insight generated yet for this patient.</p>}
          {insight && (
            <div className="stack" style={{ marginTop: 14 }}>
              <div className="card">
                <strong>AI Clinical Summary</strong>
                <p className="muted">Updated {new Date(insight.lastUpdated).toLocaleDateString()}</p>
                <p>{insight.summary}</p>
              </div>
              <div className="card" style={{ background: 'var(--surface)' }}>
                This is a support tool only — it does not diagnose or replace clinical judgment.
              </div>
              <div className="card">
                <strong>Theme Analysis</strong>
                {insight.themes.map((t) => (
                  <div key={t.name} className="mood-row">
                    <span className="mood-label">{t.name}</span>
                    <div className="mood-track">
                      <div className="mood-fill" style={{ width: `${t.percentage}%`, background: 'var(--burgundy)' }} />
                    </div>
                    <span>{t.percentage}%</span>
                  </div>
                ))}
              </div>
              <div className="card">
                <strong>Recommendations</strong>
                <ol>
                  {insight.recommendations.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ol>
              </div>
              <div className="card">
                <strong>Suggested Discussion Topics</strong>
                <ul>
                  {insight.suggestedDiscussionTopics.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'AI Buddy' && (
        <>
          <button className="btn btn-primary" disabled={generateAIChatSummary.isPending} onClick={() => generateAIChatSummary.mutate()}>
            {generateAIChatSummary.isPending ? 'Generating…' : aiChatSummary ? 'Refresh Summary' : 'Generate Summary'}
          </button>
          {aiChatSummary && (
            <div className="stack" style={{ marginTop: 14 }}>
              <div className="card">
                <strong>AI Chat Buddy Summary</strong>
                <p>{aiChatSummary.summary}</p>
              </div>
              <div className="card">
                <strong>Key Points</strong>
                <ol>
                  {aiChatSummary.keyPoints.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ol>
              </div>
              <div className="card">
                <strong>Concerns</strong>
                {aiChatSummary.concerns.length === 0 ? <p className="muted">Nothing flagged.</p> : aiChatSummary.concerns.map((c) => <p key={c}>{c}</p>)}
              </div>
            </div>
          )}
          <h3 style={{ marginTop: 20 }}>Transcript</h3>
          {aiChatLoading && <Spinner />}
          {(aiChatMessages ?? []).length === 0 && <p className="empty">This patient hasn&apos;t used Chat Buddy yet.</p>}
          {(aiChatMessages ?? []).map((m) => (
            <div key={m.id} className="card" style={{ marginTop: 8 }}>
              <strong>{m.role === 'assistant' ? 'Chat Buddy' : patient.name}</strong>
              <p>{m.content}</p>
              {m.flagged && <p className="error">Flagged: {m.flagReason}</p>}
            </div>
          ))}
        </>
      )}

      {tab === 'Sessions' && (
        <>
          <button className="btn btn-sage" onClick={() => setScheduleOpen(true)}>
            Schedule Session
          </button>
          {sessions.length === 0 && <p className="empty">No sessions scheduled yet</p>}
          <div className="stack" style={{ marginTop: 14 }}>
            {sessions.map((s) => (
              <div key={s.id} className="card">
                <div className="row space-between">
                  <strong>
                    {s.date} · {s.time}
                  </strong>
                  <span className="pill">{s.status}</span>
                </div>
                <div className="muted">{s.type}</div>
                {s.notes && <p>{s.notes}</p>}
                {s.status === 'scheduled' && (
                  <div className="row" style={{ marginTop: 8 }}>
                    <button className="btn btn-sm btn-sage" onClick={() => updateSessionStatus.mutate({ sessionId: s.id, status: 'completed' })}>
                      Mark Completed
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => updateSessionStatus.mutate({ sessionId: s.id, status: 'canceled' })}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'Alerts' && (
        <div className="stack">
          {alerts.length === 0 && <p className="empty">No alerts for this patient</p>}
          {alerts.map((a) => (
            <div key={a.id} className="card">
              <div className="row space-between">
                <strong>{a.type.replace(/_/g, ' ')}</strong>
                <span className="pill">{a.severity}</span>
              </div>
              <p>{a.message}</p>
              {!a.resolved && (
                <button className="btn btn-sm btn-sage" onClick={() => resolveAlert.mutate(a.id)}>
                  Mark Resolved
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'Audit Log' && (
        <div className="stack">
          <div className="card">Every access to this patient&apos;s data is logged under the PDPA Protection Obligation.</div>
          {auditLog.length === 0 && <p className="empty">No access history yet</p>}
          {auditLog.map((a) => (
            <div key={a.id} className="card row space-between">
              <div>
                <strong>{a.actor}</strong>
                <div className="muted">{a.action}</div>
              </div>
              <span className="muted">{new Date(a.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)}>
        <h3>Schedule a session</h3>
        <p className="muted">With {patient.name}</p>
        <label className="label">Date</label>
        <input className="input" type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
        <label className="label" style={{ marginTop: 10 }}>
          Time
        </label>
        <input className="input" placeholder="10:00 AM" value={sessionTime} onChange={(e) => setSessionTime(e.target.value)} />
        <div className="row" style={{ margin: '12px 0' }}>
          <button type="button" className={`btn btn-sm ${sessionType === 'In-Hand' ? 'btn-sage' : 'btn-ghost'}`} onClick={() => setSessionType('In-Hand')}>
            In-Hand
          </button>
          <button type="button" className={`btn btn-sm ${sessionType === 'Telehealth' ? 'btn-sage' : 'btn-ghost'}`} onClick={() => setSessionType('Telehealth')}>
            Telehealth
          </button>
        </div>
        <textarea className="textarea" placeholder="Notes (optional)" value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} />
        <button
          className="btn btn-sage"
          style={{ width: '100%', marginTop: 12 }}
          disabled={createSession.isPending}
          onClick={() => {
            if (!session?.user.id || !sessionDate.trim() || !sessionTime.trim()) return;
            createSession.mutate(
              {
                patientId: patient.id,
                clinicianId: session.user.id,
                date: sessionDate.trim(),
                time: sessionTime.trim(),
                type: sessionType,
                notes: sessionNotes.trim(),
              },
              { onSuccess: () => setScheduleOpen(false) },
            );
          }}
        >
          {createSession.isPending ? 'Saving…' : 'Schedule'}
        </button>
      </Modal>
    </div>
  );
}
