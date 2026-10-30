import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errorMessage } from '../api.js';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth">
      <section className="auth-intro">
        <h1>Know where your money went this month.</h1>
        <p>Log what comes in and what goes out, sort it by category, and see the month at a glance.</p>
        <div className="auth-sample" aria-hidden="true">
          <div className="auth-sample-row">
            <span>Salary</span>
            <span className="pos">+ ₹60,000</span>
          </div>
          <div className="auth-sample-row">
            <span>Rent</span>
            <span className="neg">− ₹18,000</span>
          </div>
          <div className="auth-sample-row">
            <span>Groceries</span>
            <span className="neg">− ₹4,250</span>
          </div>
          <div className="auth-sample-total">
            <span>Left this month</span>
            <strong>₹37,750</strong>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <h2>{isRegister ? 'Create your account' : 'Log in'}</h2>
        <form onSubmit={submit} noValidate>
          {isRegister && (
            <label className="field">
              <span>Name</span>
              <input value={form.name} onChange={set('name')} autoComplete="name" required />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
            {isRegister && <small>At least 6 characters.</small>}
          </label>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button className="btn primary wide" disabled={busy}>
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>
        <p className="auth-switch">
          {isRegister ? (
            <>
              Already have an account? <Link to="/login">Log in</Link>
            </>
          ) : (
            <>
              New here? <Link to="/register">Create an account</Link>
            </>
          )}
        </p>
      </section>
    </main>
  );
}
