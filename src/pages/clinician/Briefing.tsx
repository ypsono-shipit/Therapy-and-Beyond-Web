import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useBriefing } from '../../hooks/useBriefing';
import { useLogAuditEvent } from '../../hooks/useAuditLog';
import { usePatients } from '../../hooks/usePatients';
import { useVoiceJournals } from '../../hooks/useVoiceJournals';
import { MoodBar, Spinner } from '../../components/ui';
import { FALLBACK_AVATAR, type Patient } from '../../types';

function severityStyle(severity: string) {
  if (severity === 'high' || severity === 'urgent') return { background: 'var(--danger-dim)', color: 'var(--danger)' };
  if (severity === 'moderate' || severity === 'medium') return { background: 'var(--warning-dim)', color: 'var(--warning)' };
  return { background: 'var(--surface)', color: 'var(--muted)' };
}

export default function Briefing() {
  const { id } = useParams();
  const location = useLocation();
  const { data: roster } = usePatients();
  const fromState = (location.state as { patient?: Patient } | null)?.patient;
  const patient = fromState ?? roster?.find((p) => p.id === id);
  const patientId = patient?.id ?? id;
  const { isLoading, windowLabel, checkInCount, averages, stressors, copingUsed, wins, openAlerts, timeline, insight, since } =
    useBriefing(patientId);
  const logAuditEvent = useLogAuditEvent();
  const loggedRef = useRef(false);
  const [showTranscripts, setShowTranscripts] = useState(false);
  const { data: journals = [], isLoading: journalsLoading } = useVoiceJournals(showTranscripts ? patientId : undefined);

  useEffect(() => {
    if (!patientId || loggedRef.current) return;
    loggedRef.current = true;
    logAuditEvent.mutate({ patientId, action: 'Dr. viewed pre-session brief' });
  }, [patientId, logAuditEvent]);

  if (!patient) return <Spinner />;

  const windowJournals = journals.filter((j) => new Date(j.timestamp) >= since);
  const shownJournals = windowJournals.length ? windowJournals : journals.slice(0, 3);

  return (
    <div className="page wide">
      <Link to={`/clinic/patients/${patient.id}`} state={{ patient }} className="muted" style={{ textDecoration: 'none', fontWeight: 600 }}>
        ← {patient.name}
      </Link>
      <div className="page-header" style={{ marginTop: 12 }}>
        <div className="row">
          <img className="avatar" src={patient.avatar || FALLBACK_AVATAR} alt="" />
          <div>
            <h1 className="page-title" style={{ fontSize: 24 }}>
              Pre-session brief
            </h1>
            <div className="muted">
              {patient.name} · {windowLabel}
            </div>
          </div>
        </div>
      </div>

      {isLoading && <Spinner />}

      {!isLoading && (
        <div className="stack">
          <div className="card">
            <strong>Symptoms</strong>
            <p className="muted">
              {checkInCount} check-in{checkInCount === 1 ? '' : 's'} {windowLabel}
            </p>
            {checkInCount === 0 ? (
              <p className="muted">No check-ins in this window.</p>
            ) : (
              <>
                {averages.mood != null && <MoodBar label="Mood" value={averages.mood} color="var(--sage)" />}
                {averages.anxiety != null && <MoodBar label="Anxiety" value={averages.anxiety} color="var(--danger)" />}
                {averages.energy != null && <MoodBar label="Energy" value={averages.energy} color="var(--gold)" />}
                {averages.appetite != null && <MoodBar label="Appetite" value={averages.appetite} color="var(--burgundy)" />}
                {averages.functioning != null && <MoodBar label="Function" value={averages.functioning} color="var(--sage)" />}
                {averages.sleepDuration != null && <p className="muted">Sleep {averages.sleepDuration}h avg</p>}
              </>
            )}
          </div>

          <div className="card">
            <strong>Main stressors</strong>
            {stressors.length === 0 ? (
              <p className="muted">None logged {windowLabel}.</p>
            ) : (
              <ul>
                {stressors.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <strong>Coping used</strong>
            {copingUsed.length === 0 ? (
              <p className="muted">None logged {windowLabel}.</p>
            ) : (
              <div className="row" style={{ flexWrap: 'wrap', marginTop: 8 }}>
                {copingUsed.map((c) => (
                  <span key={c} className="pill" style={{ background: 'var(--sage-dim)', color: 'var(--sage)' }}>
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <strong>Open risk alerts</strong>
            {openAlerts.length === 0 ? (
              <p className="muted">No open alerts.</p>
            ) : (
              <div className="stack" style={{ marginTop: 10 }}>
                {openAlerts.map((a) => (
                  <div key={a.id} className="row space-between">
                    <div>
                      <div>{a.message}</div>
                      <div className="muted">{a.type.replace(/_/g, ' ')}</div>
                    </div>
                    <span className="pill" style={severityStyle(a.severity)}>
                      {a.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <strong>Wins</strong>
            {wins.length === 0 ? (
              <p className="muted">None logged {windowLabel}.</p>
            ) : (
              <div className="stack" style={{ marginTop: 10 }}>
                {wins.map((w) => (
                  <div key={`${w.date}-${w.text}`}>
                    <div>{w.text}</div>
                    <div className="muted">{new Date(w.date).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <strong>Journal</strong>
            {insight ? (
              <>
                <p className="muted">Latest insight · {new Date(insight.lastUpdated).toLocaleDateString()}</p>
                <p>{insight.summary}</p>
              </>
            ) : (
              <p className="muted">No insight generated yet.</p>
            )}
            <button type="button" className="btn btn-sm btn-ghost" style={{ marginTop: 8 }} onClick={() => setShowTranscripts((v) => !v)}>
              {showTranscripts ? 'Hide transcripts' : 'Full transcripts'}
            </button>
            {showTranscripts && (
              <div className="stack" style={{ marginTop: 12 }}>
                {journalsLoading && <Spinner />}
                {!journalsLoading && shownJournals.length === 0 && <p className="muted">No voice journals yet.</p>}
                {shownJournals.map((j) => (
                  <div key={j.id} className="card" style={{ background: 'var(--surface)', boxShadow: 'none' }}>
                    <div className="row space-between">
                      <strong>{new Date(j.timestamp).toLocaleString()}</strong>
                      <span className="muted">{j.audioDuration}</span>
                    </div>
                    {j.transcriptionStatus === 'completed' && j.transcript ? (
                      <p style={{ whiteSpace: 'pre-wrap' }}>{j.transcript}</p>
                    ) : (
                      <p className="muted">
                        {j.transcriptionStatus === 'pending' || j.transcriptionStatus === 'processing'
                          ? 'Transcribing…'
                          : j.transcriptionStatus === 'failed'
                            ? 'Transcription failed'
                            : j.transcriptionStatus === 'skipped'
                              ? 'Transcription skipped'
                              : 'No transcript'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <strong>Event timeline</strong>
            {timeline.length === 0 ? (
              <p className="muted">No life events or significant check-in events yet.</p>
            ) : (
              <div className="stack" style={{ marginTop: 10 }}>
                {timeline.map((item) => (
                  <div key={item.id} className="row space-between">
                    <div>
                      <div>{item.label}</div>
                      <div className="muted">{item.kind === 'life_event' ? 'Life event' : 'Check-in'}</div>
                    </div>
                    <span className="muted">{item.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ background: 'var(--surface)' }}>
            Support tool only — it does not diagnose or replace clinical judgment.
          </div>
        </div>
      )}
    </div>
  );
}
