import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Shield } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { send, readableError } from '../lib/api';

export default function Account() {
  const { t } = usePreferences();
  const { user, refresh, logout } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await send('patch', '/me', { name, bio });
      await refresh();
      toast(t('Profile updated'));
    } catch (error) { toast(readableError(error), 'error'); }
    finally { setSaving(false); }
  }
  async function signOut() {
    try {
      await logout();
      window.location.replace('/');
    } catch (error) { toast(readableError(error), 'error'); }
  }

  return <div className="container viewer-page">
    <header className="viewer-heading"><h1>{t('My account')}</h1></header>
    <div className="account-grid">
      <div className="account-info-card">
        <div className="account-avatar" aria-hidden="true">{user.name[0].toUpperCase()}</div>
        <h2>{user.name}</h2><span>{user.email}</span>
        <Link className="btn btn-outline btn-block" to="/watchlist"><Bookmark size={17} />{t('My watchlist')}</Link>
        {['admin', 'editor'].includes(user.role) && <Link className="btn btn-outline btn-block" to="/admin"><Shield size={17} />{t('Open admin dashboard')}</Link>}
        <button className="btn btn-ghost btn-block" onClick={signOut}>{t('Sign out')}</button>
      </div>
      <form className="account-edit-card" onSubmit={submit}>
        <div className="section-heading"><h2>{t('Edit your profile')}</h2></div>
        <label className="field">{t('Display name')}<input value={name} autoComplete="name" onChange={event => setName(event.target.value)} required minLength={2} /></label>
        <label className="field">{t('Email address')}<input value={user.email} readOnly /><small>{t('Email is currently read-only.')}</small></label>
        <label className="field">{t('About you')}<textarea rows={4} value={bio} onChange={event => setBio(event.target.value)} maxLength={500} placeholder={t('What are your favorite stories?')} /></label>
        <button className="btn btn-primary" disabled={saving}>{t(saving ? 'Saving...' : 'Save profile')}</button>
      </form>
    </div>
  </div>;
}
