import { usePreferences } from "../context/PreferencesContext";import { Link } from 'react-router-dom';
import { useState } from 'react';
import { send, readableError } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Film, Sparkles, Star, AlertCircle, LoaderCircle, SearchX } from 'lucide-react';
export function Loader({ label = 'Loading content...' }) {const { t } = usePreferences();return <div className="loader-wrap"><LoaderCircle className="spin" size={27} /><p>{t(label)}</p></div>;}
export function ErrorState({ error, retry }) {const { t } = usePreferences();return <div className="empty-state"><AlertCircle size={32} /><h3>{t("Couldn\u2019t load this page")}</h3><p>{error?.response?.data?.message || 'Please make sure the Laravel API is running, then try again.'}</p>{retry && <button onClick={retry} className="btn btn-primary">{t("Try again")}</button>}</div>;}
export function EmptyState({ title = 'Nothing here yet', description = 'Check back later or try another filter.' }) {const { t } = usePreferences();return <div className="empty-state"><SearchX size={32} /><h3>{t(title)}</h3><p>{t(description)}</p></div>;}
export function Pill({ children, tint = '' }) {const { t } = usePreferences();return <span className={'pill ' + tint}>{children}</span>;}
const gradients = [['#423368', '#15132e'], ['#15556c', '#111e35'], ['#764c3f', '#261629'], ['#326b69', '#18202d'], ['#55436d', '#1f193c'], ['#75563e', '#302127'], ['#454d83', '#161d35']];
export function PosterVisual({ item, large = false }) {
  const [a, b] = gradients[Math.abs(Number(item?.id) || item?.title?.length || 0) % gradients.length];
  return <div className={'poster-visual ' + (large ? 'is-large' : '')} style={{ '--poster-a': a, '--poster-b': b }}>
    <div className="poster-shape" aria-hidden="true"><div className="poster-orbit" /><div className="poster-orbit second" />{item?.content_type === 'movie' ? <Film size={30} /> : <Sparkles size={30} />}<strong>{item?.title}</strong></div>
    {item?.poster_url && <img key={item.poster_url} src={item.poster_url} loading={large ? 'eager' : 'lazy'} alt="" onError={event => { event.currentTarget.hidden = true; }} />}
  </div>;
}
export function TitleCard({ item }) {
  const { t } = usePreferences();
  const type = { movie: 'Movie', anime: 'Anime', donghua: 'Donghua' }[item.content_type];
  return <Link className="title-card" to={'/title/' + item.slug}>
    <div className="title-card-image"><PosterVisual item={item} /></div>
    <h3 title={item.title}>{item.title}</h3>
    <div className="title-card-meta"><span>{[t(type), item.release_year].filter(Boolean).join(' · ')}</span>
      {Number(item.average_rating) > 0 && <span className="rating"><Star size={13} fill="currentColor" />{Number(item.average_rating).toFixed(1)}</span>}
    </div>
  </Link>;
}
export function Heading({ title, subtitle, link, linkText = 'View all', children }) {
  const { t } = usePreferences();
  return <div className="section-heading"><div><h2>{t(title)}</h2>{subtitle && <p>{t(subtitle)}</p>}</div>
    <div className="section-actions">{children}{link && <Link to={link} className="text-link" aria-label={t(linkText) + ' · ' + t(title)}>{t(linkText)}</Link>}</div>
  </div>;
}
export function TitleGrid({ items }) {
  return <div className="poster-grid">{items?.map(item => <TitleCard key={item.id} item={item} />)}</div>;
}
export function StatusTag({ status }) {const { t } = usePreferences();return <span className={'status status-' + status}>{status?.replace('_', ' ') || 'unknown'}</span>;}
export function Pagination({ data, onPage }) {const { t } = usePreferences();if (!data || data.last_page <= 1) return null;return <div className="pagination"><button className="btn btn-ghost" disabled={data.current_page <= 1} onClick={() => onPage(data.current_page - 1)}>{t("Previous")}</button><span>{t("Page")} <b>{data.current_page}</b> {t("of")} <b>{data.last_page}</b> · {data.total} {t("results")}</span><button className="btn btn-ghost" disabled={data.current_page >= data.last_page} onClick={() => onPage(data.current_page + 1)}>{t("Next")}</button></div>;}
export function Field({ label, children, hint }) {const { t } = usePreferences();return <label className="field"><span>{t(label)}</span>{children}{hint && <small>{hint}</small>}</label>;}
export function SectionLoading() {const { t } = usePreferences();return <div className="skeleton-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton-card" />)}</div>;}
export function Confirm({ title = 'Confirm action', description = 'This action may not be reversible.', confirm = 'Continue', onConfirm, onClose, danger = true }) {const { t } = usePreferences();return <div className="modal-backdrop" role="presentation" onClick={onClose}><div className="modal-panel confirm-panel" role="dialog" aria-modal="true" aria-label={t(title)} onClick={(e) => e.stopPropagation()}><div className="modal-header"><h2>{t(title)}</h2><button className="icon-btn" onClick={onClose} aria-label={t("Close")}>×</button></div><p className="muted">{t(description)}</p><div className="form-actions"><button className="btn btn-ghost" onClick={onClose}>{t("Cancel")}</button><button className={'btn ' + (danger ? 'btn-danger' : 'btn-primary')} onClick={onConfirm}>{t(confirm)}</button></div></div></div>;}

export function ReportButton({ reviewId, commentId, user }) {const { t } = usePreferences();
  const [open, setOpen] = useState(false);const [reason, setReason] = useState('');const [busy, setBusy] = useState(false);const toast = useToast();
  async function report(e) {e.preventDefault();setBusy(true);try {await send('post', '/reports', { review_id: reviewId || null, comment_id: commentId || null, reason });toast('Report sent to the moderation team');setOpen(false);setReason('');} catch (e) {toast(readableError(e), 'error');} finally {setBusy(false);}}
  if (!user) return null;
  return <><button className="report-trigger" onClick={() => setOpen(true)}>{t("Report content")}</button>{open && <div className="modal-backdrop" role="presentation" onClick={() => setOpen(false)}><form className="modal-panel" role="dialog" aria-modal="true" aria-label={t("Report content")} onClick={(e) => e.stopPropagation()} onSubmit={report}><h2>{t("Report content")}</h2><p className="muted">{t("Tell our moderation team what needs attention.")}</p><label className="field">{t("Reason")}<textarea required minLength={8} maxLength={800} rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("Describe the concern...")} /></label><div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>{t("Cancel")}</button><button disabled={busy} className="btn btn-primary">{t("Submit report")}</button></div></form></div>}</>;
}
