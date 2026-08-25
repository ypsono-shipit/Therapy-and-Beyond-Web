import { Link } from 'react-router-dom';
import { Flame, Calendar, Heart, Mic, MessageCircle, BookOpen, Sparkles, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { hasCheckedInToday, useCheckIns } from '../../hooks/useCheckIns';
import { useSessions } from '../../hooks/useSessions';
import { useMyClinician } from '../../hooks/useMyClinician';
import { MoodBar, Spinner } from '../../components/ui';
import { FALLBACK_AVATAR } from '../../types';
import {
  cadenceGuidance,
  daysLoggedThisWeek,
  suggestedCadence,
  weeklyConsistencyPercent,
} from '../../lib/consistency';

export default function Home() {
  const { session, profile, hasClinician } = useAuth();
  const patientId = session?.user.id;
  const { data: checkIns, isLoading } = useCheckIns(patientId);
  const { data: sessions } = useSessions(patientId);
  const { data: clinician } = useMyClinician(patientId);
  const latest = checkIns?.[0];
  const nextSession = sessions?.find((s) => s.status === 'scheduled');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const daysThisWeek = daysLoggedThisWeek(checkIns);
  const consistencyPct = Math.round(weeklyConsistencyPercent(checkIns));
  const showedUp = hasCheckedInToday(checkIns);
  const cadence = suggestedCadence(checkIns);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="muted">{greeting},</div>
          <h1 className="page-title">{profile?.name?.split(' ')[0] ?? '…'}</h1>
        </div>
        <Link to="/app/profile">
          <img className="avatar" src={profile?.avatar_url ?? FALLBACK_AVATAR} alt="" style={{ border: '2px solid var(--burgundy)' }} />
        </Link>
      </div>

      <div className="grid grid-2">
        <div className="card" style={{ background: 'var(--charcoal)', color: 'white' }}>
          <div className="row space-between">
            <div className="row">
              <Flame color="#ddac5b" />
              <div>
                <div style={{ fontWeight: 700 }}>
                  Logged {daysThisWeek} {daysThisWeek === 1 ? 'day' : 'days'} this week
                </div>
                <div style={{ color: '#adadad', fontSize: 13 }}>
                  {showedUp ? 'You showed up today' : cadenceGuidance(cadence)}
                </div>
              </div>
            </div>
            <span className="pill" style={{ background: '#ddac5b30', color: 'var(--gold)' }}>
              {consistencyPct}%
            </span>
          </div>
        </div>

        {nextSession && clinician && (
          <div className="card">
            <div className="row" style={{ marginBottom: 10 }}>
              <Calendar size={18} color="var(--burgundy)" />
              <strong>Next Session</strong>
            </div>
            <div className="muted" style={{ marginBottom: 12 }}>
              {nextSession.date} · {nextSession.time}
            </div>
            <div className="row">
              <img className="avatar avatar-sm" src={clinician.avatar} alt="" />
              <div>
                <div style={{ fontWeight: 600 }}>{clinician.name}</div>
                <div className="muted">{clinician.title}</div>
              </div>
              <span className="pill" style={{ marginLeft: 'auto', background: nextSession.type === 'Telehealth' ? 'var(--burgundy-dim)' : 'var(--sage-dim)', color: nextSession.type === 'Telehealth' ? 'var(--burgundy)' : 'var(--sage)' }}>
                {nextSession.type}
              </span>
            </div>
            {clinician.officeHours && (
              <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
                Hours: {clinician.officeHours}
                {clinician.officeHoursTz ? ` · ${clinician.officeHoursTz}` : ''}
                {clinician.officeHoursNote ? ` — ${clinician.officeHoursNote}` : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {!nextSession && clinician?.officeHours && (
        <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
          Your clinician · {clinician.officeHours}
          {clinician.officeHoursTz ? ` · ${clinician.officeHoursTz}` : ''}
          {clinician.officeHoursNote ? ` — ${clinician.officeHoursNote}` : ''}
        </p>
      )}

      <div className="card" style={{ marginTop: 14 }}>
        <div className="row" style={{ marginBottom: 12 }}>
          <Heart size={18} color="var(--burgundy)" />
          <strong>Latest Check-In</strong>
          {latest?.source === 'voice_journal' && (
            <span className="pill" style={{ marginLeft: 'auto', background: 'var(--gold-dim)', color: 'var(--gold)' }}>
              via Voice Journal
            </span>
          )}
        </div>
        {isLoading ? (
          <Spinner />
        ) : latest ? (
          <>
            <MoodBar label="Mood" value={latest.mood} color="var(--sage)" />
            <MoodBar label="Anxiety" value={latest.anxiety} color="var(--danger)" />
            <MoodBar label="Energy" value={latest.energy} color="var(--gold)" />
            <div className="row" style={{ marginTop: 12 }}>
              <span className="muted">
                {latest.sleepDuration}h · {latest.sleepQuality} sleep
              </span>
              <span className="pill" style={{ marginLeft: 'auto', background: latest.medicationTaken ? 'var(--success-dim)' : 'var(--danger-dim)', color: latest.medicationTaken ? 'var(--success)' : 'var(--danger)' }}>
                {latest.medicationTaken ? 'Meds taken' : 'Meds missed'}
              </span>
            </div>
          </>
        ) : (
          <p className="muted">Tap Check In to log how you&apos;re feeling today.</p>
        )}
        {showedUp && (
          <p className="muted" style={{ marginTop: 12 }}>
            {cadenceGuidance(cadence)}
          </p>
        )}
      </div>

      <Link to="/app/safety" className="card" style={{ display: 'block', textDecoration: 'none', marginTop: 14 }}>
        <div className="row">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--burgundy-dim)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Shield color="var(--burgundy)" size={22} />
          </div>
          <div>
            <strong>Safety hub</strong>
            <div className="muted">Plan, contacts, and coping tools — fill in when you feel stable</div>
          </div>
        </div>
      </Link>

      <h2 style={{ margin: '24px 0 12px', fontSize: 16 }}>Quick Actions</h2>
      <div className="grid grid-4">
        {[
          { to: '/app/check-in', label: 'Check In', icon: Heart, color: 'var(--burgundy)' },
          { to: '/app/journal', label: 'Voice Journal', icon: Mic, color: 'var(--gold)' },
          hasClinician
            ? { to: '/app/messages', label: 'Messages', icon: MessageCircle, color: 'var(--sage)' }
            : { to: '/app/buddy', label: 'Chat Buddy', icon: Sparkles, color: 'var(--sage)' },
          { to: '/app/resources', label: 'Resources', icon: BookOpen, color: 'var(--charcoal)' },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="card" style={{ textDecoration: 'none', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surface)', display: 'grid', placeItems: 'center', margin: '0 auto 8px' }}>
              <a.icon color={a.color} size={22} />
            </div>
            <strong style={{ fontSize: 13 }}>{a.label}</strong>
          </Link>
        ))}
      </div>
    </div>
  );
}
