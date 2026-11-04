import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Change these if your API uses different field names
const bgOf = (t) => t?.backdrop_url || t?.banner_url || t?.poster_url || t?.poster || '';
const posterOf = (t) => t?.poster_url || t?.poster || t?.backdrop_url || '';

export default function HeroSlider({ items = [] }) {
  const [i, setI] = useState(0);
  const total = items.length;

  useEffect(() => {
    if (total < 2) return;
    const timer = setInterval(() => setI((n) => (n + 1) % total), 6000);
    return () => clearInterval(timer);
  }, [total]);

  if (!total) return null;

  const item = items[i];
  const prev = () => setI((i - 1 + total) % total);
  const next = () => setI((i + 1) % total);
  const genres = item.genres?.map((g) => g.name).slice(0, 2).join(' / ');

  return (
    <section className="hero-banner" aria-labelledby="home-hero-heading">
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          className="hero-banner-bg"
          style={{ backgroundImage: `url(${bgOf(item)})` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      </AnimatePresence>
      <div className="hero-banner-shade" />

      <div className="container hero-banner-content">
      <div className="hero-banner-intro">
        <span className="eyebrow light"><span className="live-dot" /> YOUR NEXT GREAT STORY</span>
        <h1 id="home-hero-heading">Find your next<br /><span>obsession.</span></h1>
        <p>Unforgettable films. Extraordinary anime. Discover stories that stay with you, and keep your next favorite close.</p>
        <div className="hero-banner-actions">
          <Link to="/discover" className="btn btn-primary btn-large">Explore titles <ArrowUpRight size={18} /></Link>
          <Link to="/movies" className="btn btn-hero-ghost btn-large">Browse movies</Link>
        </div>
        <div className="hero-banner-note"><span /> Movies, anime & a world of possibilities</div>
      </div>
      <div className="hero-banner-card">
        <div className="hero-card-top">
          <button className="hero-arrow" onClick={prev} aria-label="Previous">
            <ChevronLeft size={18} />
          </button>
          <Link to={`/title/${item.slug}`} className="hero-card-poster">
            <img src={posterOf(item)} alt={item.title} />
          </Link>
          <button className="hero-arrow" onClick={next} aria-label="Next">
            <ChevronRight size={18} />
          </button>
        </div>

        <h2>{item.title}</h2>
        <span className="hero-card-meta">
          {item.release_year}
          {genres ? ` · ${genres}` : ''}
        </span>
        <p>{item.synopsis || item.description}</p>

        <Link to={`/title/${item.slug}`} className="btn btn-primary">
          <Play size={16} /> Watch now
        </Link>
      </div>
      </div>
    </section>
  );
}
