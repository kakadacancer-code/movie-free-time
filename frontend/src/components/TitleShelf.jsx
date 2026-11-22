import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { Heading, TitleCard } from './UI';

export default function TitleShelf({ items, title, subtitle, link }) {
  const { t } = usePreferences();
  const rail = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  useEffect(() => {
    const node = rail.current;
    function measure() {
      setEdges({ start: node.scrollLeft < 2, end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 2 });
    }
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    node.addEventListener('scroll', measure, { passive: true });
    return () => { resize.disconnect(); node.removeEventListener('scroll', measure); };
  }, [items]);

  function scroll(direction) {
    rail.current.scrollBy({ left: direction * rail.current.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  return <section className="viewer-section">
    <Heading title={title} subtitle={subtitle} link={link}>
      {!(edges.start && edges.end) && <div className="shelf-controls">
        <button className="viewer-icon" disabled={edges.start} aria-label={t('Previous') + ' · ' + t(title)} onClick={() => scroll(-1)}><ChevronLeft size={18} /></button>
        <button className="viewer-icon" disabled={edges.end} aria-label={t('Next') + ' · ' + t(title)} onClick={() => scroll(1)}><ChevronRight size={18} /></button>
      </div>}
    </Heading>
    <div className="title-shelf" ref={rail}>{items.map(item => <TitleCard key={item.id} item={item} />)}</div>
  </section>;
}
