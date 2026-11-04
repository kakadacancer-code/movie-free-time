import { Link } from 'react-router-dom';
import { useState } from 'react';
import { send, readableError } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Film, Sparkles, ArrowUpRight, Star, Plus, AlertCircle, LoaderCircle, SearchX } from 'lucide-react';
export function Loader({ label='Loading content...' }) {return <div className="loader-wrap"><LoaderCircle className="spin" size={27}/><p>{label}</p></div>}
export function ErrorState({ error, retry }) {return <div className="empty-state"><AlertCircle size={32}/><h3>Couldn’t load this page</h3><p>{error?.response?.data?.message || 'Please make sure the Laravel API is running, then try again.'}</p>{retry&&<button onClick={retry} className="btn btn-primary">Try again</button>}</div>}
export function EmptyState({ title='Nothing here yet', description='Check back later or try another filter.' }) {return <div className="empty-state"><SearchX size={32}/><h3>{title}</h3><p>{description}</p></div>}
export function Pill({ children, tint='' }) {return <span className={'pill '+tint}>{children}</span>}
const gradients=[['#423368','#15132e'],['#15556c','#111e35'],['#764c3f','#261629'],['#326b69','#18202d'],['#55436d','#1f193c'],['#75563e','#302127'],['#454d83','#161d35']];
export function PosterVisual({ item, large=false }) {
  const [a,b]=gradients[Math.abs(Number(item?.id)||item?.title?.length||0)%gradients.length];
  return <div className={'poster-visual '+(large?'is-large':'')} style={{'--poster-a':a,'--poster-b':b}}>
    {item?.poster_url?<img src={item.poster_url} loading="lazy" alt={`${item.title} poster`} onError={e=>{e.currentTarget.style.display='none'}}/>:null}
    <div className="poster-shape"><div className="poster-orbit"/><div className="poster-orbit second"/>{item?.content_type==='anime'?<Sparkles size={38}/>:<Film size={38}/>}<strong>{item?.title}</strong><small>MovieFreeTime SELECTION</small></div>
  </div>;
}
export function TitleCard({ item }) {
  return <Link className="title-card" to={`/title/${item.slug}`}>
    <div className="title-card-image"><PosterVisual item={item}/><span className="card-tag">{item.content_type==='anime'?'ANIME':'MOVIE'}</span><span className="card-hover"><ArrowUpRight size={23}/></span></div>
    <div className="title-card-meta"><span>{item.release_year||'TBA'}</span><span className="dot-sep">·</span><span>{item.genres?.[0]?.name||'Featured'}</span>{Number(item.average_rating)>0&&<span className="rating"><Star size={12} fill="currentColor"/>{Number(item.average_rating).toFixed(1)}</span>}</div>
    <h3 title={item.title}>{item.title}</h3>
  </Link>;
}
export function Heading({eyebrow,title,subtitle,link,linkText='View all'}) {return <div className="section-heading"><div>{eyebrow&&<span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{link&&<Link to={link} className="text-link">{linkText}<ArrowUpRight size={17}/></Link>}</div>}
export function TitleGrid({items}){return <div className="poster-grid">{items?.map(item=><TitleCard key={item.id} item={item}/>)}</div>}
export function StatusTag({status}){return <span className={'status status-'+status}>{status?.replace('_',' ')||'unknown'}</span>}
export function Pagination({data,onPage}){if(!data||data.last_page<=1)return null;return <div className="pagination"><button className="btn btn-ghost" disabled={data.current_page<=1} onClick={()=>onPage(data.current_page-1)}>Previous</button><span>Page <b>{data.current_page}</b> of <b>{data.last_page}</b> · {data.total} results</span><button className="btn btn-ghost" disabled={data.current_page>=data.last_page} onClick={()=>onPage(data.current_page+1)}>Next</button></div>}
export function Field({label,children,hint}){return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>}
export function SectionLoading(){return <div className="skeleton-grid">{Array.from({length:6},(_,i)=><div key={i} className="skeleton-card"/>)}</div>}
export function Confirm({title='Confirm action',description='This action may not be reversible.',confirm='Continue',onConfirm,onClose,danger=true}){return <div className="modal-backdrop" role="presentation" onClick={onClose}><div className="modal-panel confirm-panel" role="dialog" aria-modal="true" aria-label={title} onClick={e=>e.stopPropagation()}><div className="modal-header"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close">×</button></div><p className="muted">{description}</p><div className="form-actions"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className={'btn '+(danger?'btn-danger':'btn-primary')} onClick={onConfirm}>{confirm}</button></div></div></div>}

export function ReportButton({reviewId,commentId,user}) {
  const [open,setOpen]=useState(false);const [reason,setReason]=useState('');const [busy,setBusy]=useState(false);const toast=useToast();
  async function report(e){e.preventDefault();setBusy(true);try{await send('post','/reports',{review_id:reviewId||null,comment_id:commentId||null,reason});toast('Report sent to the moderation team');setOpen(false);setReason('')}catch(e){toast(readableError(e),'error')}finally{setBusy(false)}}
  if(!user)return null;
  return <><button className="report-trigger" onClick={()=>setOpen(true)}>Report content</button>{open&&<div className="modal-backdrop" role="presentation" onClick={()=>setOpen(false)}><form className="modal-panel" role="dialog" aria-modal="true" aria-label="Report content" onClick={e=>e.stopPropagation()} onSubmit={report}><h2>Report content</h2><p className="muted">Tell our moderation team what needs attention.</p><label className="field">Reason<textarea required minLength={8} maxLength={800} rows={4} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Describe the concern..."/></label><div className="form-actions"><button type="button" className="btn btn-ghost" onClick={()=>setOpen(false)}>Cancel</button><button disabled={busy} className="btn btn-primary">Submit report</button></div></form></div>}</>
}
