import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await signIn({ email: email.trim(), password });
    setSubmitting(false);
    if (signInError) setError(signInError);
  };

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="auth-hero-inner">
          <img src="/icon.png" alt="" width={48} height={48} style={{ borderRadius: 12, marginBottom: 24 }} />
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -0.8, margin: '0 0 12px' }}>
            Care that continues between sessions.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.55, opacity: 0.88, margin: 0 }}>
            Therapy & Beyond is a PDPA-compliant platform for patients and clinicians in Singapore — daily check-ins,
            voice journals, and a clinician dashboard in one place.
          </p>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: 28 }} className="mobile-only">
            <img src="/icon.png" alt="" width={64} height={64} style={{ borderRadius: 16 }} />
          </div>
          <h2 className="page-title" style={{ fontSize: 24 }}>
            Sign in
          </h2>
          <p className="page-sub">Welcome back to Therapy & Beyond.</p>
          <form className="stack" style={{ marginTop: 24 }} onSubmit={handleSubmit}>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input id="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p className="muted" style={{ textAlign: 'center', marginTop: 18 }}>
            Don&apos;t have an account? <Link className="linkish" to="/sign-up">Sign Up</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
