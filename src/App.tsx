import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthProvider';
import { AppShell } from './components/AppShell';
import { Spinner } from './components/ui';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import Consent from './pages/onboarding/Consent';
import SelectClinician from './pages/onboarding/SelectClinician';
import WaitingInvite from './pages/onboarding/WaitingInvite';
import Walkthrough from './pages/onboarding/Walkthrough';
import DataProcessing from './pages/onboarding/DataProcessing';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Home from './pages/patient/Home';
import CheckIn from './pages/patient/CheckIn';
import Journal from './pages/patient/Journal';
import Messages from './pages/patient/Messages';
import Buddy from './pages/patient/Buddy';
import Progress from './pages/patient/Progress';
import Profile from './pages/patient/Profile';
import Resources from './pages/patient/Resources';
import Appointments from './pages/patient/Appointments';
import PrivacyData from './pages/patient/PrivacyData';
import Dashboard from './pages/clinician/Dashboard';
import Alerts from './pages/clinician/Alerts';
import PatientDetail from './pages/clinician/PatientDetail';
import ClinicianProfile from './pages/clinician/Profile';

const PATIENT_REQUIRED_CONSENTS = ['checkin_data_sharing', 'privacy_policy', 'sensitive_data_processing'] as const;

function homeFor(role: string | undefined) {
  return role === 'clinician' ? '/clinic/dashboard' : '/app/home';
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { loading, session, profile } = useAuth();
  if (loading) return <Spinner />;
  if (session) return <Navigate to={homeFor(profile?.role)} replace />;
  return children;
}

function PatientApp() {
  const { loading, session, profile, consents, patientProvisioned, needsClinicianSelection } = useAuth();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/sign-in" replace />;
  if (!profile) return <Spinner />;
  if (profile.role === 'clinician') return <Navigate to="/clinic/dashboard" replace />;
  if (patientProvisioned === null) return <Spinner />;
  if (needsClinicianSelection) return <SelectClinician />;
  if (patientProvisioned === false) return <WaitingInvite />;
  const hasAllConsents = PATIENT_REQUIRED_CONSENTS.every((c) => consents[c]);
  if (!hasAllConsents) return <Consent />;
  if (!profile.onboarding_completed_at) return <Walkthrough />;
  return (
    <AppShell role="patient">
      <Routes>
        <Route path="home" element={<Home />} />
        <Route path="check-in" element={<CheckIn />} />
        <Route path="journal" element={<Journal />} />
        <Route path="messages" element={<Messages />} />
        <Route path="buddy" element={<Buddy />} />
        <Route path="progress" element={<Progress />} />
        <Route path="profile" element={<Profile />} />
        <Route path="resources" element={<Resources />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="privacy-data" element={<PrivacyData />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Routes>
    </AppShell>
  );
}

function ClinicianApp() {
  const { loading, session, profile, consents } = useAuth();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/sign-in" replace />;
  if (!profile) return <Spinner />;
  if (profile.role === 'patient') return <Navigate to="/app/home" replace />;
  if (!consents.dpa_acceptance) return <DataProcessing />;
  if (!profile.onboarding_completed_at) return <Walkthrough />;
  return (
    <AppShell role="clinician">
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="messages" element={<Messages />} />
        <Route path="profile" element={<ClinicianProfile />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}

function RootRedirect() {
  const { loading, session, profile } = useAuth();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/sign-in" replace />;
  return <Navigate to={homeFor(profile?.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/sign-in"
        element={
          <PublicOnly>
            <SignIn />
          </PublicOnly>
        }
      />
      <Route
        path="/sign-up"
        element={
          <PublicOnly>
            <SignUp />
          </PublicOnly>
        }
      />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/app/*" element={<PatientApp />} />
      <Route path="/clinic/*" element={<ClinicianApp />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
