import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Heart,
  Mic,
  Sparkles,
  BarChart3,
  LayoutGrid,
  Bell,
  User,
  BookOpen,
  Calendar,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import { useAlerts } from '../hooks/useAlerts';
import { FALLBACK_AVATAR } from '../types';

type Role = 'patient' | 'clinician';

const PATIENT_NAV = [
  { to: '/app/home', label: 'Home', icon: Home },
  { to: '/app/check-in', label: 'Check-In', icon: Heart },
  { to: '/app/journal', label: 'Journal', icon: Mic },
  { to: '/app/buddy', label: 'Buddy', icon: Sparkles },
  { to: '/app/progress', label: 'Progress', icon: BarChart3 },
];

const PATIENT_MORE = [
  { to: '/app/safety', label: 'Safety', icon: Shield },
  { to: '/app/appointments', label: 'Appointments', icon: Calendar },
  { to: '/app/resources', label: 'Resources', icon: BookOpen },
  { to: '/app/profile', label: 'Profile', icon: User },
];

const CLINICIAN_NAV = [
  { to: '/clinic/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/clinic/alerts', label: 'Alerts', icon: Bell },
];

const CLINICIAN_MORE = [{ to: '/clinic/profile', label: 'Profile', icon: User }];

export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const { profile, signOut, hasClinician } = useAuth();
  const { data: alerts = [] } = useAlerts();
  const unresolved = role === 'clinician' ? alerts.filter((a) => !a.resolved).length : 0;
  const navigate = useNavigate();
  const nav = role === 'patient' ? PATIENT_NAV : CLINICIAN_NAV;
  const more =
    role === 'patient'
      ? hasClinician
        ? PATIENT_MORE
        : PATIENT_MORE.filter((item) => item.to !== '/app/appointments')
      : CLINICIAN_MORE;
  const accentClass = role === 'clinician' ? 'clinician' : '';
  const mobileNav = nav;

  return (
    <div className="shell has-bottom-pad">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/icon.png" alt="" />
          <span>Therapy & Beyond</span>
        </div>
        <div className="nav-section">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${accentClass} ${isActive ? 'active' : ''}`}>
              <item.icon size={18} />
              {item.label}
              {item.label === 'Alerts' && unresolved > 0 && (
                <span className="pill" style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}>
                  {unresolved}
                </span>
              )}
            </NavLink>
          ))}
        </div>
        <div className="nav-label">More</div>
        <div className="nav-section">
          {more.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${accentClass} ${isActive ? 'active' : ''}`}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="sidebar-footer">
          <button type="button" className="nav-link" onClick={() => signOut()} style={{ width: '100%' }}>
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="main">
        <div className="mobile-top">
          <div className="sidebar-brand" style={{ padding: 0 }}>
            <img src="/icon.png" alt="" />
            <span>Therapy & Beyond</span>
          </div>
          <button
            type="button"
            onClick={() => navigate(role === 'patient' ? '/app/profile' : '/clinic/profile')}
            aria-label="Profile"
          >
            <img className="avatar avatar-sm" src={profile?.avatar_url ?? FALLBACK_AVATAR} alt="" />
          </button>
        </div>
        {children}
      </div>

      <nav className="bottom-nav">
        {mobileNav.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `${accentClass} ${isActive ? 'active' : ''}`}>
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
