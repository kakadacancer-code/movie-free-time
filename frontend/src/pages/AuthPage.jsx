import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { readableError } from '../lib/api';

export default function AuthPage({ mode }) {
  const { t } = usePreferences();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isRegister = mode === 'register';
  const redirect = params.get('redirect');
  const safeTarget = redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '';

  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError('');
    try {
      const user = isRegister ? await register(values) : await login(values);
      toast(t(isRegister ? 'Welcome to MovieFreeTime!' : 'Welcome back!'));
      navigate(safeTarget || (['admin', 'editor'].includes(user.role) ? '/admin' : '/account'), { replace: true });
    } catch (error) { setError(readableError(error)); }
    finally { setBusy(false); }
  }

  return <div className="container viewer-auth"><section className="viewer-auth-card">
    <h1>{t(isRegister ? 'Create your account' : 'Sign in')}</h1>
    <form onSubmit={submit} className="auth-form">
      {error && <p className="form-error" role="alert">{error}</p>}
      {isRegister && <label className="field">{t('Full name')}<input name="name" autoComplete="name" required minLength={2} /></label>}
      <label className="field">{t('Email address')}<input name="email" type="email" autoComplete="email" required /></label>
      <label className="field">{t('Password')}<input name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 8 : 1} /></label>
      {isRegister && <label className="field">{t('Confirm password')}<input name="password_confirmation" type="password" autoComplete="new-password" required minLength={8} /></label>}
      <button className="btn btn-primary" disabled={busy}>{t(busy ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in')}</button>
    </form>
    <p>{t(isRegister ? 'Already have an account?' : 'New to MovieFreeTime?')} <Link className="text-link" to={(isRegister ? '/login' : '/register') + (safeTarget ? '?redirect=' + encodeURIComponent(safeTarget) : '')}>{t(isRegister ? 'Sign in' : 'Create an account')}</Link></p>
  </section></div>;
}
