import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { get } from '../../lib/api';
import { AdminHeading, AdminTableWrap } from '../../components/AdminUI';
import { Loader, ErrorState, EmptyState, Pagination } from '../../components/UI';
export default function AdminAudit(){const [page,setPage]=useState(1);const {data,error,isLoading,refetch}=useQuery({queryKey:['audit',page],queryFn:()=>get('/admin/audit-logs',{page})});return <><AdminHeading eyebrow="ACCOUNTABILITY" title="Audit history" subtitle="A record of important actions made in the control center."/>{isLoading?<Loader/>:error?<ErrorState error={error} retry={refetch}/>:data?.data?.length?<><AdminTableWrap><table className="admin-table"><thead><tr><th>Activity</th><th>Action by</th><th>Record</th><th>Date / Time</th></tr></thead><tbody>{data.data.map(x=><tr key={x.id}><td><div className="user-cell"><History size={16}/><b className="capital">{x.action.replaceAll('_',' ')}</b></div></td><td>{x.user?.name||'System'}</td><td>{x.entity_type} {x.entity_id&&`#${x.entity_id}`}</td><td>{new Date(x.created_at).toLocaleString()}</td></tr>)}</tbody></table></AdminTableWrap><Pagination data={data} onPage={setPage}/></>:<EmptyState title="No activity yet" description="Admin actions will be recorded here."/>}</>}
