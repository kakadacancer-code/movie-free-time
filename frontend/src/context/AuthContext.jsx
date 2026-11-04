import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, get, send } from '../lib/api';
const Context = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { const data = await get('/me'); setUser(data.user); } catch { setUser(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const login = async (values) => { await api.get('/sanctum/csrf-cookie'); const data = await send('post', '/auth/login', values); setUser(data.user); return data.user; };
  const register = async (values) => { await api.get('/sanctum/csrf-cookie'); const data = await send('post', '/auth/register', values); setUser(data.user); return data.user; };
  const logout = async () => { try { await send('post', '/auth/logout'); } finally { setUser(null); } };
  return <Context.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
