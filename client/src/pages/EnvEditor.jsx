import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function EnvEditor(){
  const [env, setEnv] = useState({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  useEffect(()=>{fetch(`${API}/admin/env`).then(r=>r.json()).then(d=>{setEnv(d.env||{});setLoading(false)}).catch(e=>{setMessage('Failed to load .env (are you on localhost?)');setLoading(false)})},[])
  const setKey=(k,v)=>setEnv({...env,[k]:v})
  const save=async e=>{
    e.preventDefault();setMessage('Saving...')
    try{const res=await fetch(`${API}/admin/env`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(env)});const data=await res.json();if(!res.ok)throw new Error(data.message||'Save failed');setMessage(data.message||'Saved') }catch(err){setMessage(err.message)}
  }
  if(loading) return <section className="card"><h3>Env editor</h3><p className="muted">Loading…</p></section>
  return (<section className="card env-editor"><h3>Env editor (local-only)</h3><p className="muted">Edit environment variables. Changes are saved to the local <code>.env</code> file on the server and are not committed.</p><form onSubmit={save}><div className="grid cols-2 gap-2">{Object.keys(env).map(k=> (<label key={k}><strong>{k}</strong><input value={env[k]||''} onChange={e=>setKey(k,e.target.value)} /></label>))}</div><div className="mt-3"><button className="button">Save .env</button> <span className="muted">{message}</span></div></form></section>)
}
