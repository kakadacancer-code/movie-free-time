import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/AdminLayout';
import { Loader } from './components/UI';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Detail from './pages/Detail';
import Discover from './pages/Discover';
import Articles, { ArticleDetail } from './pages/Articles';
import AuthPage from './pages/AuthPage';
import Watchlist from './pages/Watchlist';
import Account from './pages/Account';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTitles from './pages/admin/AdminTitles';
import AdminArticles from './pages/admin/AdminArticles';
import AdminTaxonomy from './pages/admin/AdminTaxonomy';
import AdminModeration from './pages/admin/AdminModeration';
import AdminUsers from './pages/admin/AdminUsers';
import AdminMedia from './pages/admin/AdminMedia';
import AdminImports from './pages/admin/AdminImports';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';
import AdminReports from './pages/admin/AdminReports';
import AdminAudit from './pages/admin/AdminAudit';
function Guard({ admin=false,superadmin=false,children }) {const {user,loading}=useAuth();const loc=useLocation();if(loading)return <Loader/>;if(!user)return <Navigate to={`/login?redirect=${encodeURIComponent(loc.pathname)}`} replace/>;if(admin&&!['admin','editor'].includes(user.role)||superadmin&&user.role!=='admin')return <Navigate to="/" replace/>;return children}
export default function App(){return <Routes>
 <Route element={<PublicLayout/>}><Route index element={<Home/>}/><Route path="movies" element={<Catalog type="movie"/>}/><Route path="donghua" element={<Catalog type="donghua"/>}/><Route path="anime" element={<Catalog type="anime"/>}/><Route path="title/:slug" element={<Detail/>}/><Route path="discover" element={<Discover/>}/><Route path="articles" element={<Articles/>}/><Route path="articles/:slug" element={<ArticleDetail/>}/><Route path="watchlist" element={<Guard><Watchlist/></Guard>}/><Route path="account" element={<Guard><Account/></Guard>}/></Route>
 <Route path="login" element={<AuthPage mode="login"/>}/><Route path="register" element={<AuthPage mode="register"/>}/>
 <Route path="admin" element={<Guard admin><AdminLayout/></Guard>}><Route index element={<AdminDashboard/>}/><Route path="movies" element={<AdminTitles type="movie"/>}/><Route path="donghua" element={<AdminTitles type="donghua"/>}/><Route path="anime" element={<AdminTitles type="anime"/>}/><Route path="articles" element={<AdminArticles/>}/><Route path="taxonomy" element={<AdminTaxonomy/>}/><Route path="moderation" element={<AdminModeration/>}/><Route path="media" element={<AdminMedia/>}/><Route path="imports" element={<AdminImports/>}/><Route path="analytics" element={<AdminAnalytics/>}/><Route path="users" element={<Guard superadmin><AdminUsers/></Guard>}/><Route path="reports" element={<Guard superadmin><AdminReports/></Guard>}/><Route path="settings" element={<Guard superadmin><AdminSettings/></Guard>}/><Route path="audit" element={<Guard superadmin><AdminAudit/></Guard>}/></Route>
 <Route path="*" element={<Navigate to="/" replace/>}/>
 </Routes>}
