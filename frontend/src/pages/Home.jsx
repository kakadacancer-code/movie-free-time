import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePreferences } from '../context/PreferencesContext';
import { get } from '../lib/api';
import TitleShelf from '../components/TitleShelf';
import HeroSlider from '../components/HeroSlider';
import { EmptyState, ErrorState, Heading, Loader } from '../components/UI';

const sections = [
  ['trending', '/discover'], ['categories', '/discover'], ['donghua', '/donghua'],
  ['movies', '/movies'], ['anime', '/anime'],
];

export default function Home() {
  const { t } = usePreferences();
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ['home'], queryFn: () => get('/home') });
  const { data: site } = useQuery({ queryKey: ['settings'], queryFn: () => get('/settings') });
  if (isLoading) return <Loader />;
  if (error) return <div className="container main-pad"><ErrorState error={error} retry={refetch} /></div>;
  const slides = [data.featured, ...(data.trending || [])]
    .filter((item, i, all) => item && all.findIndex(other => other?.id === item.id) === i).slice(0, 6);

  return <div className="container viewer-home">
    {slides.length ? <HeroSlider items={slides} /> : <EmptyState title="No titles yet" description="Check back soon for new releases." />}
    {sections.map(([key, link]) => {
      const section = data.sections?.[key];
      const items = (key === 'categories' ? data.genres : data[key]) || [];
      if (!section?.enabled || !items.length) return null;
      if (key !== 'categories') return <TitleShelf key={key} items={items} title={section.title} subtitle={section.subtitle} link={link} />;
      return <section key={key} className="viewer-section">
        <Heading title={section.title} subtitle={section.subtitle} link={link} />
        <div className="viewer-genres">{items.map(genre =>
          <Link className="viewer-genre" to={'/discover?genre=' + encodeURIComponent(genre.slug)} key={genre.id}>
            {genre.image_url && <img alt="" src={genre.image_url} loading="lazy" onError={event => { event.currentTarget.hidden = true; }} />}
            <span>{genre.name}</span><small>{genre.titles_count || 0} {t('titles')}</small>
          </Link>)}</div>
      </section>;
    })}
    {(site?.discovery_title || site?.discovery_subtitle) && <section className="viewer-discovery">
      <div><h2>{t(site.discovery_title || 'Discover')}</h2>{site.discovery_subtitle && <p>{t(site.discovery_subtitle)}</p>}</div>
      <Link className="btn btn-outline" to="/discover">{t('Explore titles')}</Link>
    </section>}
  </div>;
}
