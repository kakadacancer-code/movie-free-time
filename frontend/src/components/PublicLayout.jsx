import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, Menu, Search, X } from 'lucide-react';
import { get } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import PreferenceControls from './PreferenceControls';
import AnimatedOutlet from './AnimatedOutlet';
import BrandLogo from './BrandLogo';

const links = [['/', 'Home'], ['/movies', 'Movies'], ['/anime', 'Anime'], ['/donghua', 'Donghua'], ['/discover', 'Discover'], ['/articles', 'Articles']];

function Brand() {
  return <Link className="viewer-brand" to="/" aria-label="MovieFreeTime">
    <BrandLogo />
  </Link>;
}

export default function PublicLayout() {
  const { user } = useAuth();
  const { t } = usePreferences();
  const { data: site } = useQuery({ queryKey: ['settings'], queryFn: () => get('/settings') });
  const [panel, setPanel] = useState('');
  const [query, setQuery] = useState('');
  const searchButton = useRef(null);
  const menuButton = useRef(null);
  const header = useRef(null);
  const { key } = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setPanel(''); }, [key]);
  useEffect(() => {
    if (!panel) return;
    function escape(event) {
      if (event.key === 'Escape') {
        setPanel('');
        (panel === 'search' ? searchButton : menuButton).current?.focus();
      }
    }
    function outside(event) {
      if (!header.current?.contains(event.target)) setPanel('');
    }
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
    };
  }, [panel]);

  function submit(event) {
    event.preventDefault();
    setPanel('');
    const term = query.trim();
    navigate(term ? '/discover?q=' + encodeURIComponent(term) : '/discover');
  }

  const destinations = links.map(([to, name]) =>
    <NavLink key={to} to={to} end={to === '/'} onClick={() => setPanel('')}>{t(name)}</NavLink>
  );

  return <div className="public-app">
    <a className="viewer-skip" href="#viewer-content">{t('Skip to content')}</a>
    <header className="viewer-header" ref={header}>
      <div className="container viewer-bar">
        <Brand />
        <nav className="viewer-nav" aria-label={t('Main navigation')}>{destinations}</nav>
        <div className="viewer-actions">
          <button className="viewer-icon" ref={searchButton} aria-label={t('Search')} title={t('Search')} aria-expanded={panel === 'search'} aria-controls="viewer-search" onClick={() => setPanel(panel === 'search' ? '' : 'search')}><Search size={20} /></button>
          <div className="viewer-preferences"><PreferenceControls /></div>
          {user ? <>
            <Link className="viewer-icon viewer-saved" to="/watchlist" aria-label={t('My watchlist')} title={t('My watchlist')}><Bookmark size={19} /></Link>
            <Link className="viewer-avatar" to="/account" aria-label={t('My account')} title={t('My account')}>{user.name.slice(0, 1).toUpperCase()}</Link>
          </> : <Link className="btn btn-outline viewer-login" to="/login">{t('Sign in')}</Link>}
          <button ref={menuButton} className="viewer-icon viewer-menu-button" aria-label={t('Toggle navigation')} aria-expanded={panel === 'menu'} aria-controls="viewer-menu" onClick={() => setPanel(panel === 'menu' ? '' : 'menu')}>{panel === 'menu' ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </div>
      {panel === 'search' && <form className="viewer-search container" id="viewer-search" role="search" onSubmit={submit}>
        <label className="viewer-input"><Search size={18} /><input autoFocus type="search" aria-label={t('Search titles...')} placeholder={t('Search titles...')} value={query} onChange={event => setQuery(event.target.value)} /></label>
        <button className="btn btn-primary">{t('Search')}</button>
      </form>}
      {panel === 'menu' && <div className="viewer-mobile container" id="viewer-menu">
        <nav aria-label={t('Main navigation')}>{destinations}<NavLink to="/watchlist">{t('My watchlist')}</NavLink>{user && <NavLink to="/account">{t('My account')}</NavLink>}{['admin', 'editor'].includes(user?.role) && <NavLink to="/admin">{t('Admin panel')}</NavLink>}</nav>
        <PreferenceControls />
      </div>}
    </header>
    <main id="viewer-content" tabIndex="-1"><AnimatedOutlet /></main>
    <footer className="viewer-footer"><div className="container">
      <div><Brand />{site?.footer_text && <p>{t(site.footer_text)}</p>}</div>
      <nav aria-label={t('Explore')}><Link to="/discover">{t('Discover')}</Link><Link to="/articles">{t('Articles')}</Link><Link to="/watchlist">{t('My watchlist')}</Link></nav>
      <small>© {new Date().getFullYear()} MovieFreeTime</small>
    </div></footer>
  </div>;
}
