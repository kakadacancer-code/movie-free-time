import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal } from 'lucide-react';
import { get } from '../lib/api';
import { TitleGrid, Loader, ErrorState, EmptyState, Pagination } from '../components/UI';
import { usePreferences } from '../context/PreferencesContext';

const labels = { movie: 'Movies', anime: 'Anime', donghua: 'Donghua' };
const sorts = { popular: 'Most popular', rating: 'Highest rated', recent: 'Recently added', newest: 'Newest first', oldest: 'Oldest first', title: 'Title A—Z' };

export default function Catalog({ type }) {
  const { t } = usePreferences();
  const [params, setParams] = useSearchParams();
  const appliedQuery = params.get('q') || '';
  const [query, setQuery] = useState(appliedQuery);
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => { setQuery(appliedQuery); }, [appliedQuery]);
  const endpoint = type === 'movie' ? '/movies' : type ? '/' + type : '/titles';
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [endpoint, params.toString()], queryFn: () => get(endpoint, Object.fromEntries(params)),
  });
  const { data: genres } = useQuery({ queryKey: ['genres'], queryFn: () => get('/genres') });
  function change(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  }
  function clear() { setQuery(''); setParams({}); }
  const activeFilters = ['genre', 'year', 'min_rating', 'format', 'type'].filter(key => params.get(key)).length;

  return <div className="container viewer-page">
    <header className="viewer-heading"><h1>{t(labels[type] || 'Discover')}</h1></header>
    <div className="library-tools">
      <form className="library-search" role="search" onSubmit={event => { event.preventDefault(); change('q', query.trim()); }}>
        <label className="viewer-input"><Search size={19} /><input type="search" aria-label={t('Search titles...')} placeholder={t('Search titles...')} value={query} onChange={event => setQuery(event.target.value)} /></label>
        <button className="btn btn-primary">{t('Search')}</button>
      </form>
      <button className="btn btn-outline" type="button" aria-expanded={filtersOpen} aria-controls="library-filters" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={17} />{t('Filters')}{activeFilters > 0 && <span>({activeFilters})</span>}</button>
      <select className="library-sort" aria-label={t('Sort titles')} value={params.get('sort') || 'popular'} onChange={event => change('sort', event.target.value)}>
        {Object.entries(sorts).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
      </select>
    </div>
    <div className="library-filters" id="library-filters" hidden={!filtersOpen}>
      {!type && <label>{t('Content type')}<select value={params.get('type') || ''} onChange={event => change('type', event.target.value)}><option value="">{t('All stories')}</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}</select></label>}
      <label>{t('Genre')}<select value={params.get('genre') || ''} onChange={event => change('genre', event.target.value)}><option value="">{t('All genres')}</option>{genres?.map(genre => <option key={genre.id} value={genre.slug}>{genre.name}</option>)}</select></label>
      <label>{t('Release year')}<input type="number" placeholder="2024" value={params.get('year') || ''} onChange={event => change('year', event.target.value)} /></label>
      <label>{t('Minimum rating')}<select value={params.get('min_rating') || ''} onChange={event => change('min_rating', event.target.value)}><option value="">{t('Any rating')}</option>{[5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n}+ / 10</option>)}</select></label>
      {type !== 'movie' && <label>{t('Format')}<select value={params.get('format') || ''} onChange={event => change('format', event.target.value)}><option value="">{t('Any format')}</option>{['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL'].map(value => <option key={value}>{value}</option>)}</select></label>}
    </div>
    <div className="library-count"><span role="status">{isLoading ? t('Searching...') : !error && (data?.total || 0) + ' ' + t('titles found')}{params.get('genre') && ' · ' + (genres?.find(g => g.slug === params.get('genre'))?.name || params.get('genre'))}</span>
      {params.size > 0 && <button className="text-link" onClick={clear}>{t('Clear all')}</button>}
    </div>
    {isLoading ? <Loader /> : error ? <ErrorState error={error} retry={refetch} /> : data?.data?.length ?
      <><TitleGrid items={data.data} /><Pagination data={data} onPage={page => change('page', page)} /></> :
      <EmptyState title="No titles match your filters" description="Try a different genre, year or search term." />}
  </div>;
}
