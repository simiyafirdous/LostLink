import { createContext, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import './App.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const AuthContext = createContext()
const useAuth = () => useContext(AuthContext)

const sampleProductItems = [
  {
    _id: 'sample-wallet',
    name: 'Brown Leather Wallet',
    category: 'Wallet',
    locationText: 'Campus quad',
    incidentDate: '2025-10-12',
    type: 'lost',
    imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
    description: 'Leather bifold wallet with an ID card and coffee rewards card.',
  },
  {
    _id: 'sample-phone',
    name: 'Black Smartphone',
    category: 'Phone',
    locationText: 'Library entrance',
    incidentDate: '2025-10-10',
    type: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
    description: 'Smartphone with a blue case and cracked corner.',
  },
  {
    _id: 'sample-backpack',
    name: 'Gray Backpack',
    category: 'Bag',
    locationText: 'Bus stop shelter',
    incidentDate: '2025-10-09',
    type: 'lost',
    imageUrl: 'https://images.unsplash.com/photo-1518085250887-7e0f73f38e75?auto=format&fit=crop&w=900&q=80',
    description: 'Gray backpack containing a laptop sleeve and water bottle.',
  },
  {
    _id: 'sample-headphones',
    name: 'Wireless Headphones',
    category: 'Electronics',
    locationText: 'Campus coffee shop',
    incidentDate: '2025-10-08',
    type: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?auto=format&fit=crop&w=900&q=80',
    description: 'Noise-cancelling headphones left on a café table.',
  },
  {
    _id: 'sample-watch',
    name: 'Silver Wristwatch',
    category: 'Watch',
    locationText: 'Parking lot',
    incidentDate: '2025-10-07',
    type: 'lost',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
    description: 'Classic silver watch with leather band and scratched glass.',
  },
  {
    _id: 'sample-keys',
    name: 'Key Ring with Tags',
    category: 'Keys',
    locationText: 'Gym locker room',
    incidentDate: '2025-10-04',
    type: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?auto=format&fit=crop&w=900&q=80',
    description: 'Set of keys with a red plastic key tag and bike key.',
  },
  {
    _id: 'sample-laptop',
    name: 'Silver Laptop',
    category: 'Computer',
    locationText: 'Study hall',
    incidentDate: '2025-10-03',
    type: 'lost',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
    description: 'Silver laptop with sticker-covered lid and a black charger.',
  },
  {
    _id: 'sample-sunglasses',
    name: 'Aviator Sunglasses',
    category: 'Accessories',
    locationText: 'Outdoor patio',
    incidentDate: '2025-10-01',
    type: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1505238680356-667803448bb6?auto=format&fit=crop&w=900&q=80',
    description: 'Dark aviator sunglasses with a gold frame.',
  },
]

function ExampleProductCard({ item }) {
  return (
    <article className="card example-item-card">
      <div className="image">
        <img src={item.imageUrl} alt={item.name} />
      </div>
      <div>
        <small className={item.type}>{item.type?.toUpperCase()}</small>
        <h3>{item.name}</h3>
        <p>{item.category} · {item.locationText}</p>
        <p className="muted small">{new Date(item.incidentDate).toLocaleDateString()}</p>
        <p className="muted description-preview">{item.description}</p>
      </div>
    </article>
  )
}

function UploadActions() {
  return (
    <div className="upload-actions flex-row gap-3 wrap">
      <Link className="button primary" to="/report/lost">Upload Lost Item</Link>
      <Link className="button ghost" to="/report/found">Upload Found Item</Link>
    </div>
  )
}

async function request(path, options = {}) {
  const token = localStorage.getItem('lostfound_token')
  const headers = options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${API}${path}`, { ...options, headers: { ...headers, ...options.headers } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Request failed')
  return data
}

const buildImageUrl = (src) => {
  if (!src || typeof src !== "string") return ""
  return src.startsWith("http://") || src.startsWith("https://")
    ? src
    : `${API.replace("/api", "")}${src}`
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('lostfound_user') || 'null'))
  const login = (data) => { localStorage.setItem('lostfound_token', data.token); localStorage.setItem('lostfound_user', JSON.stringify(data.user)); setUser(data.user) }
  const logout = () => { localStorage.removeItem('lostfound_token'); localStorage.removeItem('lostfound_user'); setUser(null) }
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

function NotificationBell(){const [count,setCount]=useState(0);const {user}=useAuth();useEffect(()=>{if(user)request('/notifications').then(data=>setCount(data.unreadCount||0)).catch(()=>{})},[user]);return <Link className="bell" to="/notifications" aria-label="Notifications">🔔{count>0&&<sup>{count}</sup>}</Link>}
function Layout({ children }) {
  const { user, logout } = useAuth()
  return <><header><Link className="brand" to="/">LostFound<span>+</span></Link><nav><Link to="/browse">Browse</Link>{user ? <><NotificationBell/><Link to="/dashboard">Dashboard</Link><button className="link" onClick={logout}>Log out</button></> : <><Link to="/login">Log in</Link><Link className="button small" to="/register">Get started</Link></>}</nav></header><main>{children}</main><footer>LostFound+ · A simple, safer way to reconnect people with what matters.</footer></>
}
function Protected({ children, roles }) { const { user } = useAuth(); return !user ? <Navigate to="/login" replace /> : roles && !roles.includes(user.role) ? <Navigate to="/dashboard" replace /> : children }
function Notice({ error, children }) { return <>{error && <p className="error">{error}</p>}{children}</> }
function Loading() { return <p className="loading">Loading…</p> }

import PostItem from './pages/PostItem'
import ClaimsInbox from './pages/ClaimsInbox'
import MyMatches from './pages/MyMatches'
import EnvEditor from './pages/EnvEditor'

function Home() { return <><section className="hero"><p className="eyebrow">LOST & FOUND, MADE SIMPLE</p><h1>Bring lost things <em>back home.</em></h1><p>Report, browse, and safely recover belongings through AI image matching platform.</p><div className="actions"><Link className="button" to="/report/lost">Report a lost item</Link><Link className="button ghost" to="/browse">Browse items</Link></div></section><section className="steps"><article><b>01</b><h3>Report it</h3><p>Share details and upload photos of lost or found items.</p></article><article><b>02</b><h3>AI Match</h3><p>Groq Vision extracts visual features and ranks matches automatically.</p></article><article><b>03</b><h3>Recover safely</h3><p>Answer AI verification questions to claim your item.</p></article></section><section className="example-products"><p className="eyebrow">EXAMPLE PRODUCTS</p><h2>Sample lost and found reports</h2><p className="muted">Explore example item listings and submit your own report with images and details.</p><div className="items sample-grid">
      {sampleProductItems.map((item) => <ExampleProductCard item={item} key={item._id} />)}
    </div><div className="actions"><Link className="button" to="/report/lost">Upload a lost item</Link><Link className="button ghost" to="/report/found">Upload a found item</Link></div></section></> }

function AuthPage({ register = false }) { const navigate = useNavigate(), { login } = useAuth(); const [form, setForm] = useState({ name:'', email:'', password:'' }), [error,setError]=useState(''), [loading,setLoading]=useState(false); const submit=async e=>{e.preventDefault();setLoading(true);setError('');try{const data=await request(`/auth/${register?'register':'login'}`,{method:'POST',body:JSON.stringify(form)});login(data);navigate('/dashboard')}catch(e){setError(e.message)}finally{setLoading(false)}};return <section className="auth card"><p className="eyebrow">WELCOME</p><h2>{register?'Create your account':'Welcome back'}</h2><form onSubmit={submit}><Notice error={error}/>{register&&<label>Name<input required minLength="2" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}<label>Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Password<input required minLength="6" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><button disabled={loading}>{loading?'Please wait…':register?'Create account':'Log in'}</button></form><p>{register?'Already registered? ':'New here? '}<Link to={register?'/login':'/register'}>{register?'Log in':'Create an account'}</Link></p></section> }

function Dashboard() { const { user }=useAuth(); const links=[['Report lost item','/report/lost'],['Report found item','/report/found'],['My AI matches','/my-matches'],['Incoming claims inbox','/claims-inbox'],['My reports','/my-reports'],['My submitted claims','/my-claims']]; if(user.role==='moderator') links.push(['Moderator dashboard','/moderator']);if(user.role==='admin')links.push(['Admin dashboard','/admin']);return <section><p className="eyebrow">YOUR SPACE</p><h2>Hello, {user.name}</h2><p className="muted">You are signed in as a {user.role}.</p><div className="grid">{links.map(([label,to])=><Link className="card action-card" to={to} key={to}>{label}<span>→</span></Link>)}</div></section> }

function ItemCard({ item }) { const legacy=item.model==='LostItem'||item.model==='FoundItem',to=legacy?`/legacy/${item.reportType}/${item._id}`:`/items/${item._id}`;const imageSrc=buildImageUrl(item.image||item.imageUrl);return <Link className="card item-card" to={to}><div className="image">{imageSrc?<img src={imageSrc} alt={item.name}/>:<span>⌕</span>}</div><div><small className={item.type||item.reportType}>{item.type||item.reportType}</small><h3>{item.name}</h3><p>{item.category} · {item.locationText||item.location}</p><p className="muted">{new Date(item.incidentDate||item.date).toLocaleDateString()}</p></div></Link> }

function Browse() { const [items,setItems]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[filters,setFilters]=useState({q:'',reportType:'',category:'',location:''});const load=async e=>{e?.preventDefault();setLoading(true);try{const q=new URLSearchParams(Object.entries(filters).filter(([,v])=>v));setItems((await request(`/items?${q}`)).items)}catch(e){setError(e.message)}finally{setLoading(false)}};useEffect(()=>{load()},[]);return <section><p className="eyebrow">EXPLORE REPORTS</p><h2>Find what you’re looking for</h2><form className="filters card" onSubmit={load}><input placeholder="Search items" value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})}/><select value={filters.reportType} onChange={e=>setFilters({...filters,reportType:e.target.value})}><option value="">Lost & found</option><option value="lost">Lost</option><option value="found">Found</option></select><input placeholder="Category" value={filters.category} onChange={e=>setFilters({...filters,category:e.target.value})}/><input placeholder="Location" value={filters.location} onChange={e=>setFilters({...filters,location:e.target.value})}/><button>Search</button></form><div className="browse-cta card p-4 mt-4"><h3>Upload a new product report</h3><p className="muted">Submit a lost or found item and let AI match it with other reports.</p><UploadActions/></div><Notice error={error}/>{loading?<Loading/>:<><div className="items">{items.length?items.map(i=><ItemCard item={i} key={i._id}/>):<p>No matching report listings yet.</p>}</div>{!items.length&&<section className="example-products mt-6"><p className="eyebrow">EXAMPLE PRODUCTS</p><h3>Sample reports you can explore</h3><p className="muted">These examples show how a reported item will appear once uploaded.</p><div className="items sample-grid">{sampleProductItems.map((item)=><ExampleProductCard item={item} key={item._id}/> )}</div></section>}</>} </section> }

function Details() { const {id}=useParams(),{user}=useAuth();const [item,setItem]=useState(),[error,setError]=useState('');useEffect(()=>{request(`/items/${id}`).then(d=>setItem(d.item)).catch(e=>setError(e.message))},[id]);if(error)return <Notice error={error}/>;if(!item)return <Loading/>;const imageSrc=buildImageUrl(item.image||item.imageUrl);return <section className="detail"><div className="image large">{imageSrc?<img src={imageSrc} alt={item.name}/>:<span>⌕</span>}</div><div><small className={item.type||item.reportType}>{item.type||item.reportType}</small><h2>{item.name}</h2><p>{item.description}</p><dl><dt>Category</dt><dd>{item.category}</dd><dt>Location</dt><dd>{item.locationText||item.location}</dd><dt>Date</dt><dd>{new Date(item.incidentDate||item.date).toLocaleDateString()}</dd><dt>Status</dt><dd>{item.status}</dd></dl>{item.ai&&<div className="card p-3 my-3 bg-subtle"><h4 className="small bold mb-1">🤖 AI Visual Features:</h4><p className="small muted">Color: {item.ai.primary_color} · Brand: {item.ai.brand||'N/A'} · Condition: {item.ai.condition}</p></div>}{user&&item.owner? <Link className="button" to={`/items/${id}/matches`}>View AI Matches</Link>:<Link className="button" to="/login">Log in to view</Link>}</div></section> }

function LegacyDetails({type}){const {id}=useParams(),{user}=useAuth(),[item,setItem]=useState(),[error,setError]=useState('');useEffect(()=>{request(`/${type}/${id}`).then(data=>setItem(data[type==='lost'?'lostItem':'foundItem'])).catch(e=>setError(e.message))},[id,type]);if(error)return <Notice error={error}/>;if(!item)return <Loading/>;const imageSrc=buildImageUrl(item.imageUrl);return <section className="detail"><div className="image large">{imageSrc?<img src={imageSrc} alt={item.itemName}/>:<span>⌕</span>}</div><div><small className={type}>{type}</small><h2>{item.itemName}</h2><p>{item.description}</p><dl><dt>Category</dt><dd>{item.category}</dd><dt>Location</dt><dd>{item.location}</dd><dt>Date</dt><dd>{new Date(item.dateLost||item.dateFound).toLocaleDateString()}</dd><dt>Details</dt><dd>{item.identifyingDetails||'—'}</dd></dl>{type==='found'&&user&&<Link className="button" to={`/items/${id}/claim?itemModel=FoundItem`}>Claim item</Link>}</div></section>}

function ClaimPage(){const {id}=useParams(),nav=useNavigate(),location=useLocation();const itemModel=new URLSearchParams(location.search).get('itemModel')||'Item';const [message,setMessage]=useState(''),[proofDetails,setProof]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false);const submit=async e=>{e.preventDefault();setLoading(true);try{await request(`/claims/${id}`,{method:'POST',body:JSON.stringify({message,proofDetails,itemModel})});nav('/my-claims')}catch(e){setError(e.message)}finally{setLoading(false)}};return <section className="auth card"><h2>Submit ownership claim</h2><form onSubmit={submit}><Notice error={error}/><label>Why is this your item?<textarea required value={message} onChange={e=>setMessage(e.target.value)}/></label><label>Proof or unique details<textarea value={proofDetails} onChange={e=>setProof(e.target.value)}/></label><button disabled={loading}>Submit claim</button></form></section>}

function MyReports(){const [items,setItems]=useState(),[error,setError]=useState('');useEffect(()=>{Promise.all([request('/items/mine'),request('/lost/mine'),request('/found/mine')]).then(([current,lost,found])=>setItems([...current.items,...lost.lostItems.map(i=>({...i,name:i.itemName,image:i.imageUrl,date:i.dateLost,reportType:'lost',model:'LostItem'})),...found.foundItems.map(i=>({...i,name:i.itemName,image:i.imageUrl,date:i.dateFound,reportType:'found',model:'FoundItem'}))])).catch(e=>setError(e.message))},[]);return <section><h2>My reports</h2><Notice error={error}/>{!items?<Loading/>:<div className="items">{items.map(i=><ItemCard item={i} key={`${i.model||'Item'}-${i._id}`}/>)}</div>}</section>}

function MatchResults(){const {id}=useParams();const [data,setData]=useState(),[found,setFound]=useState(),[error,setError]=useState('');useEffect(()=>{Promise.all([request(`/items/${id}`),request(`/items/${id}/matches`)]).then(([item,matches])=>{setFound(item.item);setData(matches)}).catch(e=>setError(e.message))},[id]);if(error)return <Notice error={error}/>;if(!data||!found)return <Loading/>;return <section><p className="eyebrow">AI-ASSISTED MATCHING</p><h2>{data.matches.length?'🤖 Possible Match Found!':'No prominent possible matches yet'}</h2><p className="muted">Visual similarity leads the score. Results are suggestions only and never prove ownership.</p><div className="list">{data.matches.map(match=><article className="card match-card" key={match._id}><div className="match-images"><div><img src={buildImageUrl(found.image||found.imageUrl)} alt="Found item"/><small>Found-item photo</small></div><div><img src={buildImageUrl(match.imageUrl||match.image)} alt={match.name}/><small>Possible lost-item photo</small></div></div><h3>{match.name}</h3><b>{match.score}% combined similarity score</b><p>{(match.matchReasons||[]).map(reason=><span key={reason}>✓ {reason} · </span>)}</p><Link className="button small" to={`/items/${match._id}`}>View item details</Link></article>)}</div>{!data.matches.length&&<Link className="button" to="/my-reports">View my reports</Link>}</section>}

function MyClaims(){const [claims,setClaims]=useState(),[error,setError]=useState('');useEffect(()=>{request('/claims/mine').then(d=>setClaims(d.claims)).catch(e=>setError(e.message))},[]);return <section><h2>My claims</h2><Notice error={error}/>{!claims?<Loading/>:<div className="list">{claims.map(c=><article className="card" key={c._id}><h3>{c.foundItem?.name||c.item?.name||'Item Claim'}</h3><p>{c.message}</p><b>Status: {c.status}</b>{c.finder&&<div className="success-banner p-2 mt-2 font-xs">Finder Contact: {c.finder.name} ({c.finder.email})</div>}</article>)}</div>}</section>}

function Notifications(){const [data,setData]=useState(),[error,setError]=useState('');const markRead=async id=>{try{await request(`/notifications/${id}/read`,{method:'PATCH'});setData({...data,notifications:data.notifications.map(n=>n._id===id?{...n,isRead:true}:n)})}catch(e){setError(e.message)}};useEffect(()=>{request('/notifications').then(setData).catch(e=>setError(e.message))},[]);return <section><p className="eyebrow">SMART MATCH ALERTS</p><h2>Possible matches</h2><p className="muted">These alerts are suggestions, not proof of ownership. Submit a claim for verification.</p><Notice error={error}/>{!data?<Loading/>:<div className="list">{data.notifications.length?data.notifications.map(n=>{const lostName=n.relatedLostItemId?.name||n.relatedLostItemId?.itemName||'a lost item',foundName=n.relatedFoundItemId?.name||n.relatedFoundItemId?.itemName||'a found item',legacy=n.relatedFoundItemModel==='FoundItem',id=n.relatedFoundItemId?._id;return <article className="card" key={n._id}><small>🔔 POSSIBLE MATCH FOUND</small><h3>{lostName} may match {foundName}</h3><p>{n.message}</p><b>{n.matchScore}% match</b><p>{(n.matchReasons?.length?n.matchReasons:n.reasons)?.map(reason=><span key={reason}>✓ {reason} · </span>)}</p>{n.semanticInfo?.conflictingDetails?.length>0&&<p className="muted">Review: {n.semanticInfo.conflictingDetails.join(' · ')}</p>}{n.socialMediaUrl&&<p><a href={n.socialMediaUrl} target="_blank" rel="noreferrer">View supporting public post</a></p>}<Link className="button small" to={legacy?`/legacy/found/${id}`:`/items/${id}`}>View match</Link> <Link className="button ghost small" to={legacy?`/items/${id}/claim?itemModel=FoundItem`:`/items/${id}/claim`}>Claim item</Link>{!n.isRead&&<button className="link" onClick={()=>markRead(n._id)}>Mark read</button>}</article>}) :<p>No possible matches yet.</p>}</div>}</section>}

function Moderator(){const [claims,setClaims]=useState(),[error,setError]=useState('');const review=async(id,status)=>{try{await request(`/claims/${id}/review`,{method:'PATCH',body:JSON.stringify({status})});setClaims(claims.map(c=>c._id===id?{...c,status}:c))}catch(e){setError(e.message)}};useEffect(()=>{request('/claims?status=pending').then(d=>setClaims(d.claims)).catch(e=>setError(e.message))},[]);return <section><p className="eyebrow">MODERATION</p><h2>Pending claims</h2><Notice error={error}/>{!claims?<Loading/>:<div className="list">{claims.map(c=><article className="card" key={c._id}><h3>{c.item?.name||c.foundItem?.name} <small>by {c.claimant?.name}</small></h3><p>{c.message}</p><button onClick={()=>review(c._id,'approved')}>Approve</button> <button className="danger" onClick={()=>review(c._id,'rejected')}>Reject</button></article>)}</div>}</section>}

function Admin(){const [data,setData]=useState(),[error,setError]=useState('');useEffect(()=>{request('/admin/dashboard').then(setData).catch(e=>setError(e.message))},[]);return <section><p className="eyebrow">ADMINISTRATION</p><h2>Platform overview</h2><Notice error={error}/>{!data?<Loading/>:<div className="grid"><article className="card"><b>{data.users}</b><p>Users</p></article><article className="card"><b>{data.items}</b><p>Item reports</p></article><article className="card"><b>{data.claims}</b><p>Claims</p></article></div>}</section>}

function App(){return <AuthProvider><BrowserRouter><Layout><Routes><Route path="/" element={<Home/>}/><Route path="/browse" element={<Browse/>}/><Route path="/login" element={<AuthPage/>}/><Route path="/register" element={<AuthPage register/>}/><Route path="/dashboard" element={<Protected><Dashboard/></Protected>}/><Route path="/report/lost" element={<PostItem type="lost"/>}/><Route path="/report/found" element={<Protected><PostItem type="found"/></Protected>}/><Route path="/my-matches" element={<Protected><MyMatches/></Protected>}/><Route path="/claims-inbox" element={<Protected><ClaimsInbox/></Protected>}/><Route path="/items/:id" element={<Details/>}/><Route path="/legacy/lost/:id" element={<LegacyDetails type="lost"/>}/><Route path="/legacy/found/:id" element={<LegacyDetails type="found"/>}/><Route path="/items/:id/matches" element={<Protected><MatchResults/></Protected>}/><Route path="/items/:id/claim" element={<Protected><ClaimPage/></Protected>}/><Route path="/my-reports" element={<Protected><MyReports/></Protected>}/><Route path="/my-claims" element={<Protected><MyClaims/></Protected>}/><Route path="/notifications" element={<Protected><Notifications/></Protected>}/><Route path="/moderator" element={<Protected roles={['moderator','admin']}><Moderator/></Protected>}/><Route path="/admin" element={<Protected roles={['admin']}><Admin/></Protected>}/><Route path="/env-editor" element={<EnvEditor/>}/></Routes></Layout></BrowserRouter></AuthProvider>}
export default App
