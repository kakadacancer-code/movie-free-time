import { useEffect, useRef, useState } from 'react';
import { usePreferences } from '../context/PreferencesContext';
import './VideoPlayer.css';

function stored(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function remember(key, value) { try { localStorage.setItem(key, value); } catch { /* Optional storage. */ } }

export default function VideoPlayer({ media, poster, autoPlay = false, onEnded }) {
  const { language, t } = usePreferences();
  const videoRef = useRef(null);
  const restore = useRef(null);
  const [quality, setQuality] = useState(() => stored('moviefreetime-quality', 'original'));
  const [subtitle, setSubtitle] = useState(() => stored('moviefreetime-subtitle', language));
  const [error, setError] = useState('');
  const [autoplayEnabled, setAutoplayEnabled] = useState(autoPlay);
  const sources = [
    ...(media.video_url ? [{ quality: 'original', url: media.video_url }] : []),
    ...(media.video_sources || []),
  ];
  const selected = sources.find(source => source.quality === quality) || sources[0];
  const tracks = media.subtitles || [];
  const trackIndex = tracks.findIndex(track => track.language === subtitle);
  const actualSubtitle = trackIndex >= 0 ? String(trackIndex) : 'off';

  function applySubtitles() {
    const video = videoRef.current;
    if (!video) return;
    for (let index = 0; index < video.textTracks.length; index++) {
      video.textTracks[index].mode = index === trackIndex ? 'showing' : 'disabled';
    }
  }
  useEffect(applySubtitles, [subtitle, trackIndex]);

  function changeQuality(next) {
    const video = videoRef.current;
    if (video) restore.current = { time: video.currentTime, playing: !video.paused, rate: video.playbackRate, volume: video.volume, muted: video.muted };
    setError('');
    setAutoplayEnabled(false);
    setQuality(next);
    remember('moviefreetime-quality', next);
  }
  function loaded() {
    setError('');
    const video = videoRef.current;
    const previous = restore.current;
    restore.current = null;
    if (video && previous) {
      video.currentTime = Number.isFinite(video.duration) ? Math.min(previous.time, Math.max(0, video.duration - 0.1)) : previous.time;
      video.playbackRate = previous.rate;
      video.volume = previous.volume;
      video.muted = previous.muted;
      if (previous.playing) video.play().catch(() => {});
    }
    applySubtitles();
  }
  return <div className="enhanced-player">
    <div className="video-frame">
      <video ref={videoRef} key={selected?.url} src={selected?.url} controls playsInline autoPlay={autoplayEnabled} preload="metadata" poster={poster || undefined} onLoadedMetadata={loaded} onEnded={onEnded} onError={() => setError(t('This video could not be played. Try another quality or reload the page.'))}>
        {tracks.map((track, index) => <track key={track.url} kind="subtitles" src={track.url} srcLang={track.language} label={track.label} default={index === trackIndex} onLoad={applySubtitles} onError={() => setError(t('This subtitle could not be loaded. Try another subtitle.'))} />)}
        {t('Your browser does not support video playback.')}
      </video>
    </div>
    {(sources.length > 1 || tracks.length > 0) && <div className="player-settings">
      {sources.length > 1 && <label>{t('Quality')}<select aria-label={t('Video quality')} value={selected?.quality || ''} onChange={event => changeQuality(event.target.value)}>
        {sources.map(source => <option key={source.quality} value={source.quality}>{source.quality === 'original' ? t('Original') : source.quality}</option>)}
      </select></label>}
      {tracks.length > 0 && <label>{t('Subtitles')}<select aria-label={t('Subtitles')} value={actualSubtitle} onChange={event => {
        const value = event.target.value === 'off' ? 'off' : tracks[Number(event.target.value)].language;
        setSubtitle(value);remember('moviefreetime-subtitle', value);
      }}>
        <option value="off">{t('Off')}</option>
        {tracks.map((track, index) => <option key={track.url} value={index}>{track.label}</option>)}
      </select></label>}
    </div>}
    {error && <p className="player-error" role="alert">{error}</p>}
  </div>;
}
