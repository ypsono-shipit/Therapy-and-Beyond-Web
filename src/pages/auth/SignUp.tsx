import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, User } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { uploadAvatar } from '../../hooks/useAvatarUpload';
import type { UserRole } from '../../types';

export default function SignUp() {
  const { signUp, refreshProfile } = useAuth();
  const [role, setRole] = useState<UserRole>('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Please fill in your name, email, and a password of at least 6 characters.');
      return;
    }
    setSubmitting(true);
    const { error: signUpError, userId, hasSession } = await signUp({
      email: email.trim(),
      password,
      name: name.trim(),
      role,
    });
    if (signUpError) {
      setSubmitting(false);
      setError(signUpError);
      return;
    }
    if (file && userId && hasSession) {
      try {
        await uploadAvatar(userId, file);
        await refreshProfile(userId);
      } catch (err) {
        console.warn('avatar upload failed', err);
      }
    }
    setSubmitting(false);
    if (!hasSession) setDone(true);
  };

  if (done) {
    return (
      <div className="auth-panel" style={{ minHeight: '100vh' }}>
        <div className="auth-card card" style={{ textAlign: 'center' }}>
          <h2 className="page-title" style={{ fontSize: 24 }}>
            Check your email
          </h2>
          <p className="page-sub">
            We sent a confirmation link to {email}. Confirm your address, then come back and sign in.
          </p>
          <Link className="btn btn-primary" to="/sign-in" style={{ marginTop: 20 }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="auth-hero-inner">
          <img src="/icon.png" alt="" width={48} height={48} style={{ borderRadius: 12, marginBottom: 24 }} />
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -0.8, margin: '0 0 12px' }}>Create your account</h1>
          <p style={{ fontSize: 16, lineHeight: 1.55, opacity: 0.88, margin: 0 }}>
            Patients stay connected between sessions. Clinicians see the picture before the appointment.
          </p>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <Link to="/sign-in" className="muted" style={{ fontWeight: 600, textDecoration: 'none' }}>
            ← Back
          </Link>
          <h2 className="page-title" style={{ fontSize: 24, marginTop: 12 }}>
            Create your account
          </h2>
          <form className="stack" style={{ marginTop: 20 }} onSubmit={handleSignUp}>
            <div style={{ textAlign: 'center' }}>
              <label style={{ display: 'inline-block', cursor: 'pointer' }}>
                <div
                  className="avatar avatar-lg"
                  style={{
                    margin: '0 auto 8px',
                    display: 'grid',
                    placeItems: 'center',
                    overflow: 'hidden',
                    background: 'var(--surface)',
                  }}
                >
                  {preview ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User color="#adadad" />}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const next = e.target.files?.[0] ?? null;
                    setFile(next);
                    setPreview(next ? URL.createObjectURL(next) : null);
                  }}
                />
                <span className="muted" style={{ fontSize: 13 }}>
                  {preview ? 'Tap to change photo' : 'Add a profile photo (optional)'}
                </span>
              </label>
            </div>
            <div className="row">
              <button
                type="button"
                className="btn"
                style={{
                  flex: 1,
                  background: role === 'patient' ? 'var(--burgundy)' : 'var(--white)',
                  color: role === 'patient' ? 'white' : 'var(--burgundy)',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onClick={() => setRole('patient')}
              >
                <User size={18} /> Patient
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  flex: 1,
                  background: role === 'clinician' ? 'var(--sage)' : 'var(--white)',
                  color: role === 'clinician' ? 'white' : 'var(--sage)',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onClick={() => setRole('clinician')}
              >
                <Stethoscope size={18} /> Clinician
              </button>
            </div>
            {role === 'patient' && (
              <p className="muted" style={{ fontSize: 13 }}>
                Your clinician needs to invite you by email before you can check in — sign up first, then ask them to
                send the invite if you haven&apos;t already.
              </p>
            )}
            <div>
              <label className="label">Full name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Johnson" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Sign Up'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
