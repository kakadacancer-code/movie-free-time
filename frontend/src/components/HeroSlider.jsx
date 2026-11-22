import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clapperboard, Info, Pause, Play, Star } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { PosterVisual } from './UI';

const slideDuration = 7000;
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

export default function HeroSlider({ items = [] }) {
  const { t } = usePreferences();
  const [slide, setSlide] = useState(0);
  const [rotating, setRotating] = useState(() => !window.matchMedia(reducedMotionQuery).matches);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(() => !document.hidden);
  const count = items.length;
  const index = count ? slide % count : 0;
  const advancing = rotating && visible && !hovered && count > 1;

  useEffect(() => {
    const motion = window.matchMedia(reducedMotionQuery);
    const syncVisibility = () => setVisible(!document.hidden);
    const syncMotion = () => { if (motion.matches) setRotating(false); };
    document.addEventListener('visibilitychange', syncVisibility);
    motion.addEventListener('change', syncMotion);
    return () => {
      document.removeEventListener('visibilitychange', syncVisibility);
      motion.removeEventListener('change', syncMotion);
    };
  }, []);

  useEffect(() => {
    if (!advancing) return;
    const timer = window.setTimeout(() => setSlide((index + 1) % count), slideDuration);
    return () => window.clearTimeout(timer);
  }, [advancing, count, index]);

  const item = items[index];
  if (!item) return null;

  const type = { movie: 'Movie', anime: 'Anime', donghua: 'Donghua' }[item.content_type];
  const facts = [t(type), item.release_year, ...(item.genres || []).slice(0, 2).map(genre => genre.name)].filter(Boolean);
  const artwork = item.backdrop_url || item.poster_url;
  const move = step => setSlide(current => (current + step + count) % count);
  const rotationLabel = t(rotating ? 'Pause slideshow' : 'Play slideshow');

  return <section className="spotlight" aria-label={t('Featured titles')}
    onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true); }}
    onPointerLeave={() => setHovered(false)}
    onFocusCapture={event => { if (event.target.matches(':focus-visible') && !event.currentTarget.contains(event.relatedTarget)) setRotating(false); }}>
    {artwork && <img key={artwork} className="spotlight-art" alt="" src={artwork} fetchPriority="high" onError={event => { event.currentTarget.hidden = true; }} />}
    <div className="spotlight-copy">
      <span className="spotlight-label"><Clapperboard size={16} />{t('Featured title')}</span>
      <h1 id="spotlight-title" title={item.title}>{item.title}</h1>
      <div className="spotlight-facts">{facts.map(fact => <span key={fact}>{fact}</span>)}{Number(item.average_rating) > 0 && <span className="spotlight-rating"><Star size={14} fill="currentColor" />{Number(item.average_rating).toFixed(1)}</span>}</div>
    </div>
    {item.synopsis && <p className="spotlight-summary">{item.synopsis}</p>}
    <div key={item.id} className="spotlight-poster" aria-hidden="true"><PosterVisual item={item} large /></div>
    <div className="spotlight-footer">
      <Link to={'/title/' + item.slug} className="btn btn-primary" aria-label={t('View details') + ' · ' + item.title}><Info size={17} />{t('View details')}</Link>
      {count > 1 && <div className="spotlight-controls" role="group" aria-label={t('Featured titles')}>
        <button aria-label={rotationLabel} title={rotationLabel} onClick={() => setRotating(value => !value)}>{rotating ? <Pause size={15} /> : <Play size={15} />}</button>
        <button aria-label={t('Previous')} onClick={() => move(-1)}><ChevronLeft size={18} /></button>
        <span aria-live={advancing ? 'off' : 'polite'} aria-atomic="true">{index + 1} / {count}</span>
        <button aria-label={t('Next')} onClick={() => move(1)}><ChevronRight size={18} /></button>
      </div>}
    </div>
  </section>;
}
