import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookmarkPlus, Play, Send, Star } from 'lucide-react';
import { get, send, readableError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';
import { ErrorState, Heading, Loader, PosterVisual, ReportButton, TitleGrid } from '../components/UI';
import VideoPlayer from '../components/VideoPlayer';
import '../episodes.css';

function trailerEmbed(url) {
  try {
    const u = new URL(url);
    if (!['youtube.com', 'www.youtube.com', 'youtu.be'].includes(u.hostname)) return null;
    const id = u.hostname === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v') || u.pathname.split('/embed/')[1];
    return id ? 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) : null;
  } catch { return null; }
}

export default function Detail() {
  const { slug } = useParams();
  const { t } = usePreferences();
  const { user } = useAuth();
  const navigate = useNavigate();
  const client = useQueryClient();
  const toast = useToast();
  const [score, setScore] = useState('8');
  const [review, setReview] = useState('');
  const [busy, setBusy] = useState(false);
  const [episodeId, setEpisodeId] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ['title', slug], queryFn: () => get('/titles/' + slug) });
  const title = data?.data;
  const episodes = data?.episodes || [];
  const playable = episodes.filter(ep => ep.video_url || ep.video_sources?.length);
  const episode = playable.find(ep => ep.id === episodeId) || playable[0];
  const { data: reviews } = useQuery({ queryKey: ['reviews', title?.id], queryFn: () => get('/titles/' + title.id + '/reviews'), enabled: !!title });

  async function action(path, body, message) {
    if (!user) { navigate('/login?redirect=' + encodeURIComponent('/title/' + slug)); return false; }
    setBusy(true);
    try {
      const result = await send('post', path, body);
      toast(t(message));
      if (path === '/me/watchlist') client.invalidateQueries({ queryKey: ['watchlist'] });
      if (result?.average_rating != null) client.setQueryData(['title', slug], old => old ? { ...old, data: { ...old.data, average_rating: result.average_rating } } : old);
      return true;
    } catch (error) { toast(readableError(error), 'error'); return false; }
    finally { setBusy(false); }
  }

  if (isLoading) return <Loader />;
  if (error) return <div className="container main-pad"><ErrorState error={error} retry={refetch} /></div>;
  const media = episode || ((title.video_url || title.video_sources?.length) ? title : null);
  const type = { movie: 'Movies', anime: 'Anime', donghua: 'Donghua' }[title.content_type];
  const collection = title.content_type === 'movie' ? '/movies' : '/' + title.content_type;
  const trailer = trailerEmbed(title.trailer_url);
  const facts = [['Release', title.release_date || title.release_year], ['Episodes', title.episodes_count], ['Studio', title.studio], ['Origin', title.country], ['Language', title.original_language], ['Age rating', title.age_rating], ['Status', title.release_status]].filter(([, value]) => value);
  const episodeLabel = ep => ep.title || (t('Episode') + ' ' + ep.episode_number);

  return <div className="container viewer-page viewer-title">
    <nav className="viewer-crumbs" aria-label={t('Back to catalog')}><Link to="/">{t('Home')}</Link><span>/</span><Link to={collection}>{t(type)}</Link></nav>
    <section className="viewer-title-intro">
      <div className="viewer-title-poster"><PosterVisual item={title} large /></div>
      <div className="viewer-title-info">
        <h1>{title.title}</h1>{title.original_title && title.original_title !== title.title && <p className="viewer-original">{title.original_title}</p>}
        <div className="viewer-facts">
          {title.release_year && <span>{title.release_year}</span>}
          {!!title.runtime_minutes && <span>{title.runtime_minutes} {t('min')}</span>}
          {playable.length > 0 && <span>{playable.length} {t(playable.length === 1 ? 'episode available' : 'episodes available')}</span>}
          <span><Star size={15} />{Number(title.average_rating) > 0 ? Number(title.average_rating).toFixed(1) + '/10' : t('Not rated')}</span>
        </div>
        <div className="genre-tag-row">{title.genres?.map(genre => <Link key={genre.id} to={'/discover?genre=' + encodeURIComponent(genre.slug)}>{genre.name}</Link>)}</div>
        {title.synopsis && <p className="viewer-synopsis">{title.synopsis}</p>}
        <div className="detail-buttons">{media && <a className="btn btn-primary" href="#watch-movie"><Play size={17} fill="currentColor" />{t(episode ? 'Watch episodes' : 'Watch movie')}</a>}
          <button className={'btn ' + (media ? 'btn-outline' : 'btn-primary')} disabled={busy} onClick={() => action('/me/watchlist', { media_title_id: title.id, status: 'planned' }, 'Added to your watchlist')}><BookmarkPlus size={17} />{t('Add to watchlist')}</button>
          {title.trailer_url && <a className="btn btn-ghost" href={trailer ? '#official-trailer' : title.trailer_url} target={trailer ? undefined : '_blank'} rel="noopener noreferrer">{t('Official trailer')}</a>}
        </div>
      </div>
    </section>
    <div className="viewer-title-body">
      <div className="viewer-title-main">
        <section id="watch-movie" className="viewer-panel">
          <h2>{media ? (episode ? episodeLabel(episode) : t('Watch movie')) : t('Movie video coming soon')}</h2>
          {media ? <>
            <VideoPlayer key={episode?.id || slug} media={media} poster={title.backdrop_url || title.poster_url} autoPlay={autoPlay} onEnded={() => {
              if (!episode) return;
              const next = playable.find(ep => ep.episode_number > episode.episode_number);
              if (next) { setAutoPlay(true); setEpisodeId(next.id); }
            }} />
            {episode && <div className="viewer-episodes"><h3>{t('Episodes')}</h3><div className="episode-picker">{episodes.map(ep => <button type="button" key={ep.id} disabled={!ep.video_url && !ep.video_sources?.length} aria-pressed={ep.id === episode.id} className={'episode-chip' + (ep.id === episode.id ? ' active' : '')} onClick={() => { setAutoPlay(false); setEpisodeId(ep.id); }}>
              {ep.title && <b>{ep.episode_number}</b>}<span>{episodeLabel(ep)}</span>
            </button>)}</div></div>}
          </> : <p>{t('The full video has not been added yet.')}</p>}
        </section>
        {trailer && <section id="official-trailer" className="viewer-panel"><h2>{t('Official trailer')}</h2><div className="video-frame"><iframe src={trailer} title={title.title + ' · ' + t('Official trailer')} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div></section>}
        <section className="viewer-panel"><h2>{t('Community reviews')} <small>({reviews?.total || 0})</small></h2>
          {reviews?.data?.length ? reviews.data.map(r => <div className="review-item" key={r.id}><b>{r.user?.name}</b><small>{new Date(r.created_at).toLocaleDateString()}</small><p>{r.body}</p><ReportButton reviewId={r.id} user={user} /></div>) : <p>{t('No published reviews yet. Be the first to share your thoughts.')}</p>}
          {user && <form className="review-form" onSubmit={async event => { event.preventDefault(); if (await action('/titles/' + title.id + '/reviews', { body: review }, 'Review submitted for moderation')) setReview(''); }}>
            <label className="field">{t('Write a review')}<textarea required minLength={10} rows={4} value={review} onChange={event => setReview(event.target.value)} /></label>
            <button disabled={busy} className="btn btn-outline"><Send size={16} />{t('Submit review')}</button>
          </form>}
        </section>
      </div>
      <aside className="viewer-title-side">
        {facts.length > 0 && <section className="viewer-panel"><h2>{t('About this story')}</h2><dl>{facts.map(([name, value]) => <div key={name}><dt>{t(name)}</dt><dd>{value}</dd></div>)}</dl></section>}
        <section className="viewer-panel"><h2>{t('How would you rate it?')}</h2>
          <div className="viewer-score"><Star size={18} /><select aria-label={t('Your rating')} value={score} onChange={event => setScore(event.target.value)}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1} / 10</option>)}</select></div>
          <button disabled={busy} className="btn btn-outline btn-block" onClick={() => action('/titles/' + title.id + '/ratings', { score: Number(score) }, 'Your rating was saved')}>{t('Save rating')}</button>
        </section>
      </aside>
    </div>
    {!!data.related?.length && <section className="viewer-section"><Heading title="You might also like" /><TitleGrid items={data.related} /></section>}
  </div>;
}
