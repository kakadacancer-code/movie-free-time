import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
const Context = createContext(null);
export function ToastProvider({ children }) {
  const reduceMotion = useReducedMotion();
  const [messages, setMessages] = useState([]);
  function toast(message, kind='success') {
    const id = Date.now()+Math.random(); setMessages(v=>[...v,{ id, message,kind }]);
    window.setTimeout(()=>setMessages(v=>v.filter(x=>x.id!==id)),4200);
  }
  return <Context.Provider value={toast}>{children}<div className="toast-stack" role="status" aria-live="polite"><AnimatePresence initial={false}>{messages.map(t=><motion.div layout={!reduceMotion} initial={reduceMotion ? false : {opacity:0, y:12, scale:0.97}} animate={{opacity:1, y:0, scale:1}} exit={{opacity:0, x:reduceMotion ? 0 : 24}} transition={{duration:reduceMotion ? 0 : 0.2}} key={t.id} className={'toast '+t.kind}>{t.kind==='error'?<AlertCircle size={18}/>:<CheckCircle2 size={18}/>}<span>{t.message}</span><button aria-label="Dismiss" onClick={()=>setMessages(v=>v.filter(x=>x.id!==t.id))}><X size={16}/></button></motion.div>)}</AnimatePresence></div></Context.Provider>;
}
export const useToast=()=>useContext(Context);
