import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tag, Folder, Trash2, Pencil, Plus, Upload } from 'lucide-react';
import { get, send, api, readableError } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { AdminHeading } from '../../components/AdminUI';
import { Loader, ErrorState, Field } from '../../components/UI';

function CategoryEditor({ item, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: item?.name || '', description: item?.description || '', image_path: item?.image_path || '' });
  const [preview, setPreview] = useState(item?.image_url || '');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData(); body.append('file', file);
      const { data } = await api.post('/api/v1/admin/media', body);
      setForm(v => ({ ...v, image_path: data.data.path }));
      setPreview(data.data.url);
    } catch (error) { toast(readableError(error), 'error'); }
    finally { setUploading(false); e.target.value = ''; }
  }
  async function save(e) {
    e.preventDefault(); setBusy(true);
    try {
      await send(item ? 'put' : 'post', `/admin/genres${item ? `/${item.id}` : ''}`, { ...form, image_path: form.image_path || null });
      toast(item ? 'Category updated' : 'Category added'); onSaved(); onClose();
    } catch (error) { toast(readableError(error), 'error'); }
    finally { setBusy(false); }
  }
  return <div className="modal-backdrop"><div className="modal-panel category-editor" role="dialog" aria-modal="true" aria-labelledby="category-editor-title"><h2 id="category-editor-title">{item ? 'Edit category' : 'Add category'}</h2><p className="category-editor-note">Choose a name and background for your homepage tile.</p><form onSubmit={save}>
    <Field label="Name"><input required maxLength={80} value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} /></Field>
    <Field label="Description"><textarea rows={3} maxLength={500} value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))} /></Field>
    <Field label="Background image"><input type="url" placeholder="https://example.com/category.jpg" value={form.image_path.startsWith('https://') ? form.image_path : ''} onChange={e => { const value = e.target.value; setForm(v => ({ ...v, image_path: value })); setPreview(value); }} disabled={uploading} /><small>Upload JPG, PNG or WebP (up to 5 MB), or paste an HTTPS image URL.</small></Field>
    <label className="btn btn-outline btn-small upload-btn"><Upload size={16} />{uploading ? 'Uploading...' : 'Upload background'}<input type="file" hidden accept="image/jpeg,image/png,image/webp" disabled={busy || uploading} onChange={upload} /></label>
    {preview && <div className="category-image-preview"><img src={preview} alt="Category background preview" /><button type="button" className="btn btn-ghost btn-small" disabled={busy || uploading} onClick={() => { setForm(v => ({ ...v, image_path: '' })); setPreview(''); }}>Remove image</button></div>}
    <div className="form-actions"><button type="button" className="btn btn-ghost" disabled={busy || uploading} onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy || uploading}>{busy ? 'Saving...' : 'Save category'}</button></div>
  </form></div></div>;
}

export default function AdminTaxonomy() {
  const toast = useToast(); const client = useQueryClient();
  const [newCategory, setNewCategory] = useState('');
  const [editing, setEditing] = useState(undefined); const [busy, setBusy] = useState(false);
  const genres = useQuery({ queryKey: ['genres'], queryFn: () => get('/genres') });
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => get('/categories') });
  function invalidate() { ['home', 'genres', 'categories'].forEach(key => client.invalidateQueries({ queryKey: [key] })); }
  async function addArticleCategory(e) {
    e.preventDefault(); setBusy(true);
    try { await send('post', '/admin/categories', { name: newCategory }); setNewCategory(''); toast('Added successfully'); invalidate(); }
    catch (error) { toast(readableError(error), 'error'); } finally { setBusy(false); }
  }
  async function remove(type, id) {
    if (!window.confirm('Remove this taxonomy item? It must be unused.')) return;
    try { await send('delete', `/admin/${type}/${id}`); toast('Removed'); invalidate(); } catch (error) { toast(readableError(error), 'error'); }
  }
  return <><AdminHeading eyebrow="CONTENT ORGANIZATION" title="Genres & categories" subtitle="Manage homepage category names, descriptions and background images." /><div className="taxonomy-grid category-management">
    <section className="admin-panel category-library"><div className="admin-panel-heading"><div><span className="eyebrow">HOMEPAGE</span><h3>Categories <span className="category-count">{genres.data?.length || 0}</span></h3><p>Organize your titles and choose the images visitors see.</p></div><button className="btn btn-primary btn-small" onClick={() => setEditing(null)}><Plus size={17} /> Add category</button></div>
      {genres.isLoading ? <Loader /> : genres.error ? <ErrorState error={genres.error} retry={genres.refetch} /> : genres.data?.length ? <div className="category-admin-grid">{genres.data.map(g => <article className="category-admin-card" key={g.id}><div className="category-admin-image">{g.image_url ? <img src={g.image_url} alt="" loading="lazy" onError={e => { e.currentTarget.hidden = true; }} /> : <Tag size={25} />}<span>{g.titles_count} {g.titles_count === 1 ? 'title' : 'titles'}</span></div><div className="category-admin-details"><div><h4>{g.name}</h4><p>{g.description || 'Explore this category'}</p></div><div className="category-admin-actions"><button className="icon-btn" onClick={() => setEditing(g)} title={`Edit ${g.name}`} aria-label={`Edit ${g.name}`}><Pencil size={16} /></button><button className="icon-btn danger-hover" title={`Delete ${g.name}`} aria-label={`Delete ${g.name}`} onClick={() => remove('genres', g.id)}><Trash2 size={16} /></button></div></div></article>)}</div> : <div className="category-empty"><Tag size={28} /><h4>No categories yet</h4><p>Add your first category with a name and background image.</p></div>}
    </section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">EDITORIAL</span><h3>Article categories ({categories.data?.length || 0})</h3></div><Folder size={20} /></div><form onSubmit={addArticleCategory} className="inline-create"><input required placeholder="New category name" value={newCategory} onChange={e => setNewCategory(e.target.value)} /><button className="btn btn-primary" disabled={busy}><Plus size={17} /> Add</button></form>
      {categories.isLoading ? <Loader /> : categories.error ? <ErrorState error={categories.error} retry={categories.refetch} /> : <div className="taxonomy-list">{categories.data?.map(c => <div key={c.id}><span className="tax-icon"><Folder size={17} /></span><span><b>{c.name}</b><small>{c.articles_count} articles</small></span><button className="icon-btn danger-hover" title="Delete category" onClick={() => remove('categories', c.id)}><Trash2 size={16} /></button></div>)}</div>}
    </section>
  </div>{editing !== undefined && <CategoryEditor key={editing?.id || 'new'} item={editing} onClose={() => setEditing(undefined)} onSaved={invalidate} />}</>;
}
