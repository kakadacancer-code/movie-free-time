import axios from 'axios';
export const api = axios.create({ baseURL: '/', withCredentials: true, withXSRFToken: true, headers: { Accept: 'application/json' } });
export async function get(path, params) {
  const { data } = await api.get(`/api/v1${path}`, { params });
  // Laravel resource collections nest pagination in meta; list views use it at the top level.
  return data?.meta && Array.isArray(data.data) ? { ...data, ...data.meta } : data;
}
export async function send(method, path, body) { const { data } = await api({ method, url: `/api/v1${path}`, data: body }); return data; }
export function readableError(e) {
  const data = e.response?.data;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  return data?.message || e.message || 'Something went wrong.';
}
