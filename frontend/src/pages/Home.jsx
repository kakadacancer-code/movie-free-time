import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles, Film, Tv, Compass } from 'lucide-react';
import { get } from '../lib/api';
import HeroSlider from '../components/HeroSlider';
import { Heading, TitleGrid, Loader, ErrorState } from '../components/UI';

const sections = [
  ['trending', 'Trend', '/discover', 'Explore All'],
  ['categories', 'Category', '/discover', 'All Categories'],
  ['donghua', 'Donghua', '/donghua', 'All Donghua'],
  ['movies', 'Movie', '/movies', 'All Movies'],
  ['anime', 'Anime', '/anime', 'All Anime'],
];

export default function Home() {
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ['home'], queryFn: () => get('/home') });
  const { data: site } = useQuery({ queryKey: ['settings'], queryFn: () => get('/settings') });
  if (isLoading) return <Loader />;
  if (error) return <div className="container main-pad"><ErrorState error={error} retry={refetch} /></div>;
  const slides = [data?.featured, ...(data?.trending || [])]
    .filter(Boolean)
    .filter((title, index, items) => items.findIndex(item => item.id === title.id) === index)
    .slice(0, 6);
  return <><HeroSlider items={slides} />{sections.map(([key, label, link, linkText], index) => {
    const section = data?.sections?.[key];
    if (!section?.enabled) return null;
    return <motion.section key={key} initial={{ opacity: 0, y: 17 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }} className="container home-section">
      <Heading eyebrow={`${String(index + 1).padStart(2, '0')} / ${label.toUpperCase()}`} title={section.title} subtitle={section.subtitle} link={link} linkText={linkText} />
      {key === 'categories' ? <div className="genres-grid">{(data?.genres || []).map((genre, i) => <Link key={genre.id} to={`/discover?genre=${genre.slug}`} className={`genre-tile genre-${i % 5}`}><span className="genre-symbol" aria-hidden="true">✦</span>{genre.image_url && <img className="genre-background" src={genre.image_url} alt="" loading="lazy" onError={e=>{e.currentTarget.hidden=true}}/>}{genre.image_url && <span className="genre-image-shade" aria-hidden="true"/>}<span className="genre-label"><b>{genre.name}</b><small>{genre.titles_count || 0} titles</small></span><span className="genre-open" aria-hidden="true"><ArrowUpRight size={18} /></span></Link>)}</div> : <TitleGrid items={data?.[key] || []} />}
    </motion.section>;
  })}
    <section className="container home-section home-discovery" aria-labelledby="discovery-heading">
      <div className="discovery-intro">
        <span className="eyebrow"><Sparkles size={15} /> YOUR NEXT WATCH STARTS HERE</span>
        <h2 id="discovery-heading">{site?.discovery_title || 'What are you in the mood for?'}</h2>
        <p>{site?.discovery_subtitle || 'A little adventure. A different world. A story you didn’t see coming. Follow your mood and find your next favorite.'}</p>
        <Link className="btn btn-primary" to="/discover"><Compass size={18} /> Find my next watch <ArrowUpRight size={17} /></Link>
        {!!data?.genres?.length && <div className="discovery-genres" aria-label="Explore genres">{data.genres.slice(0, 5).map(genre => <Link key={genre.id} to={`/discover?genre=${encodeURIComponent(genre.slug)}`}>{genre.name}<ArrowUpRight size={13} /></Link>)}</div>}
      </div>
      <div className="discovery-paths">
        {[
          ['/movies', Film, '01', 'Make it a movie night', 'Big moments. Unforgettable stories.', 'movies'],
          ['/anime', Tv, '02', 'Step into another world', 'Find your next anime obsession.', 'anime'],
          ['/donghua', Sparkles, '03', 'Discover something different', 'Explore the world of Chinese animation.', 'donghua'],
        ].map(([to, Icon, number, title, description, tone]) => <Link key={to} to={to} className={`discovery-path discovery-path-${tone}`}><span className="discovery-path-icon"><Icon size={24} /></span><span className="discovery-path-copy"><small>{number} / EXPLORE</small><h3>{title}</h3><p>{description}</p></span><ArrowUpRight className="discovery-path-arrow" size={21} /></Link>)}
      </div>
    </section>
  </>;
}
