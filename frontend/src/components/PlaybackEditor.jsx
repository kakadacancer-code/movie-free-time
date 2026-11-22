import { useState } from 'react';
import { api, readableError } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { usePreferences } from '../context/PreferencesContext';
import './VideoPlayer.css';

const qualities = ['360p', '480p', '720p', '1080p', '1440p', '2160p'];
export default function PlaybackEditor({ sources = [], subtitles = [], onChange, disabled = false, onBusyChange }) {
  const { t } = usePreferences();
  const toast = useToast();
  const [quality, setQuality] = useState('720p');
  const [language, setLanguage] = useState('km');
  const [busy, setBusy] = useState('');
  const locked = disabled || !!busy;
  async function upload(file, kind) {
    if (!file) return;
    const isVideo = kind === 'video';
    if (file.size > (isVideo ? 1024 ** 3 : 2 * 1024 ** 2)) { toast(isVideo ? 'Choose a video smaller than 1 GB.' : 'Choose a subtitle smaller than 2 MB.', 'error');return; }
    setBusy(kind);onBusyChange?.(true);
    try {
      const body = new FormData();body.append('file', file);
      const { data } = await api.post(`/api/v1/admin/${isVideo ? 'videos' : 'subtitles'}`, body, { onUploadProgress: event => setBusy(`${kind} ${event.total ? Math.round(event.loaded * 100 / event.total) : 0}%`) });
      if (isVideo) onChange({ video_sources: [...sources.filter(source => source.quality !== quality), { quality, path: data.data.path }] });
      else onChange({ subtitles: [...subtitles.filter(track => track.language !== language), { language, label: language === 'km' ? 'ខ្មែរ' : 'English', path: data.data.path }] });
      toast(t('File uploaded. Save your changes to attach it.'));
    } catch (error) { toast(readableError(error), 'error'); }
    finally { setBusy('');onBusyChange?.(false); }
  }
  return <div className="playback-editor">
    <h4>{t('Quality & subtitles')}</h4>
    <p className="muted">{t('Upload each quality separately. Use matching cuts of the same video so playback stays in sync.')}</p>
    <div className="playback-upload-row">
      <select aria-label={t('Upload quality')} value={quality} disabled={locked} onChange={event => setQuality(event.target.value)}>{qualities.map(value => <option key={value}>{value}</option>)}</select>
      <label className="btn btn-outline btn-small">{t('Upload quality video')}<input hidden type="file" accept="video/mp4,video/webm,.mp4,.webm" disabled={locked} onChange={event => { const file = event.target.files?.[0];event.target.value = '';upload(file, 'video'); }} /></label>
    </div>
    <ul className="playback-files">{sources.map(source => <li key={source.quality}><span>{source.quality}</span><button type="button" className="btn btn-ghost btn-small" disabled={locked} aria-label={`${t('Remove')} ${source.quality}`} onClick={() => onChange({ video_sources: sources.filter(item => item.quality !== source.quality) })}>{t('Remove')}</button></li>)}</ul>
    <div className="playback-upload-row">
      <select aria-label={t('Subtitle language')} value={language} disabled={locked} onChange={event => setLanguage(event.target.value)}><option value="km">ខ្មែរ</option><option value="en">English</option></select>
      <label className="btn btn-outline btn-small">{t('Upload subtitle (.vtt)')}<input hidden type="file" accept=".vtt,text/vtt" disabled={locked} onChange={event => { const file = event.target.files?.[0];event.target.value = '';upload(file, 'subtitle'); }} /></label>
    </div>
    <ul className="playback-files">{subtitles.map((track, index) => <li key={`${track.language}-${index}`}><span>{track.label}</span><button type="button" className="btn btn-ghost btn-small" disabled={locked} aria-label={`${t('Remove')} ${track.label}`} onClick={() => onChange({ subtitles: subtitles.filter((_, i) => i !== index) })}>{t('Remove')}</button></li>)}</ul>
    {busy && <p role="status">{t('Uploading...')} {busy}</p>}
  </div>;
}
