import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, Save, Plus } from 'lucide-react';
import { get, send, api, readableError } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Loader, ErrorState } from './UI';
import '../episodes.css';

const MAX_BYTES = 1024 * 1024 * 1024;
// Pressing Enter inside these inputs must not submit the surrounding title form.
const noEnter = e => { if (e.key === 'Enter') e.preventDefault(); };

async function uploadVideo(file, onProgress) {
  if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 1 GB.`);
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post('/api/v1/admin/videos', fd, {
    onUploadProgress: ev => onProgress(ev.total ? Math.round(ev.loaded * 100 / ev.total) : 0),
  });
  return data.data.path;
}

function EpisodeRow({ ep, disabled, onSave, onDelete, onReplace }) {
  const [number, setNumber] = useState(String(ep.episode_number));
  const [title, setTitle] = useState(ep.title || '');
  const changed = Number(number) !== ep.episode_number || title !== (ep.title || '');
  return (
    <div className="episode-row">
      <input type="number" min="1" aria-label="Episode number" value={number} disabled={disabled} onKeyDown={noEnter} onChange={e => setNumber(e.target.value)} />
      <input aria-label="Episode title" placeholder={`Episode ${ep.episode_number}`} value={title} disabled={disabled} onKeyDown={noEnter} onChange={e => setTitle(e.target.value)} />
      <div className="episode-actions">
        <button type="button" className="icon-btn" title="Save changes" disabled={disabled || !changed || !Number(number)} onClick={() => onSave(ep, { episode_number: Number(number), title: title.trim() || null })}><Save size={17} /></button>
        <button type="button" className="icon-btn danger-hover" title="Delete episode" disabled={disabled} onClick={() => onDelete(ep)}><Trash2 size={17} /></button>
      </div>
      <div className="episode-meta">
        {ep.has_video ? <span className="ok">Video attached</span> : <span className="none">No video yet</span>}
        <label className="btn btn-outline btn-small">
          <Upload size={14} />{ep.has_video ? 'Replace video' : 'Upload video'}
          <input type="file" hidden accept="video/mp4,video/webm,.mp4,.webm" disabled={disabled} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onReplace(ep, f); }} />
        </label>
      </div>
    </div>
  );
}

export default function EpisodeManager({ titleId, mainVideo }) {
  const toast = useToast();
  const client = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin-episodes', titleId], queryFn: () => get(`/admin/titles/${titleId}/episodes`) });
  const episodes = data?.data || [];
  const nextNumber = episodes.reduce((m, e) => Math.max(m, e.episode_number), 0) + 1;
  const [busy, setBusy] = useState('');
  const [progress, setProgress] = useState(0);
  const [newNumber, setNewNumber] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const disabled = !!busy;
  const highest = episodes.reduce((m, e) => Math.max(m, e.episode_number), 0);
  const have = new Set(episodes.map(e => e.episode_number));
  const missing = Array.from({ length: highest }, (_, i) => i + 1).filter(n => !have.has(n)).slice(0, 12);

  const reload = async () => { await refetch(); client.invalidateQueries({ queryKey: ['title'] }); };

  // Select one or many video files: each one becomes the next episode, in file-name order.
  async function addFiles(files, startNumber) {
    const list = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    if (!list.length) return;
    let number = startNumber || Number(newNumber) || nextNumber;
    let done = 0;
    for (const file of list) {
      setBusy(`Uploading ${done + 1} of ${list.length}: ${file.name}`);
      setProgress(0);
      try {
        const path = await uploadVideo(file, setProgress);
        await send('post', `/admin/titles/${titleId}/episodes`, { episode_number: number, title: list.length === 1 && !startNumber ? (newTitle.trim() || null) : null, video_path: path });
        number += 1; done += 1;
      } catch (e) { toast(`${file.name}: ${readableError(e)}`, 'error'); break; }
    }
    setBusy(''); setProgress(0);
    if (done) { setNewNumber(''); setNewTitle(''); toast(done === 1 ? 'Episode added' : `${done} episodes added`); }
    await reload();
  }

  async function addEmpty() {
    setBusy('Adding episode');
    try {
      await send('post', `/admin/titles/${titleId}/episodes`, { episode_number: Number(newNumber) || nextNumber, title: newTitle.trim() || null });
      setNewNumber(''); setNewTitle(''); toast('Episode added. Upload its video when ready.');
      await reload();
    } catch (e) { toast(readableError(e), 'error'); } finally { setBusy(''); }
  }

  // Turns the old single "Movie video" of the title into a real episode.
  async function useMainVideo(number) {
    setBusy('Adding episode');
    try {
      await send('post', `/admin/titles/${titleId}/episodes`, { episode_number: number, video_path: mainVideo });
      toast(`Main video added as Episode ${number}`); await reload();
    } catch (e) { toast(readableError(e), 'error'); } finally { setBusy(''); }
  }

  async function save(ep, body) {
    setBusy('Saving');
    try { await send('put', `/admin/episodes/${ep.id}`, body); toast('Episode updated'); await reload(); }
    catch (e) { toast(readableError(e), 'error'); } finally { setBusy(''); }
  }

  async function replaceVideo(ep, file) {
    setBusy(`Uploading ${file.name}`); setProgress(0);
    try {
      const path = await uploadVideo(file, setProgress);
      await send('put', `/admin/episodes/${ep.id}`, { video_path: path });
      toast('Video updated'); await reload();
    } catch (e) { toast(readableError(e), 'error'); } finally { setBusy(''); setProgress(0); }
  }

  async function remove(ep) {
    if (!window.confirm(`Delete episode ${ep.episode_number}?`)) return;
    setBusy('Deleting');
    try { await send('delete', `/admin/episodes/${ep.id}`); toast('Episode deleted'); await reload(); }
    catch (e) { toast(readableError(e), 'error'); } finally { setBusy(''); }
  }

  if (isLoading) return <Loader />;
  if (error) return <ErrorState error={error} retry={refetch} />;

  return (
    <div className="episode-manager">
      {missing.length > 0 && <div className="episode-missing" role="alert">
        <b>Missing {missing.length > 1 ? 'episodes' : 'episode'}: {missing.join(', ')}</b>
        <small>Visitors will not see {missing.length > 1 ? 'these' : 'this'} until you upload {missing.length > 1 ? 'them' : 'it'}.</small>
        <div className="episode-add-buttons">
          {missing.map(n => <label key={n} className="btn btn-primary btn-small">
            <Upload size={14} />Upload Episode {n}
            <input type="file" hidden accept="video/mp4,video/webm,.mp4,.webm" disabled={disabled} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) addFiles([f], n); }} />
          </label>)}
          {mainVideo && missing.includes(1) && <button type="button" className="btn btn-outline btn-small" disabled={disabled} onClick={() => useMainVideo(1)}>Use the main video as Episode 1</button>}
        </div>
      </div>}
      {episodes.length > 0
        ? <div className="episode-list">{episodes.map(ep => <EpisodeRow key={ep.id} ep={ep} disabled={disabled} onSave={save} onDelete={remove} onReplace={replaceVideo} />)}</div>
        : <p className="muted">No episodes yet. Add the first one below.</p>}
      <div className="episode-add">
        <div className="episode-add-fields">
          <input type="number" min="1" aria-label="New episode number" placeholder={`#${nextNumber}`} value={newNumber} disabled={disabled} onKeyDown={noEnter} onChange={e => setNewNumber(e.target.value)} />
          <input aria-label="New episode title" placeholder="Episode title (optional)" value={newTitle} disabled={disabled} onKeyDown={noEnter} onChange={e => setNewTitle(e.target.value)} />
        </div>
        <div className="episode-add-buttons">
          <label className="btn btn-primary btn-small">
            <Upload size={15} />{busy ? 'Working...' : 'Upload episode video(s)'}
            <input type="file" hidden multiple accept="video/mp4,video/webm,.mp4,.webm" disabled={disabled} onChange={e => { const files = [...(e.target.files || [])]; e.target.value = ''; addFiles(files); }} />
          </label>
          <button type="button" className="btn btn-outline btn-small" disabled={disabled} onClick={addEmpty}><Plus size={15} /> Add without video</button>
        </div>
        {busy && <><small>{busy}{progress > 0 ? ` (${progress}%)` : ''}</small><div className="episode-progress"><span style={{ width: `${progress}%` }} /></div></>}
        <small>Tip: pick several files at once. They are added in file-name order starting at the number above (or the next free number). Episodes save immediately; you do not need to press &ldquo;Save changes&rdquo;.</small>
      </div>
    </div>
  );
}