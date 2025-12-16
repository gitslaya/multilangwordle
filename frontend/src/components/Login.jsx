import React, { useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Login({ onLogin }){
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e){
    e.preventDefault();
    setLoading(true);
    try{
      // Try register first (register endpoint returns token on success)
      const reg = await axios.post(`${API}/api/register`, { email, password: pass }).then(r=>r.data).catch(()=>null);
      if(reg && reg.token){
        localStorage.setItem('token', reg.token);
        localStorage.setItem('user', JSON.stringify(reg.user));
        onLogin(reg.user);
        return;
      }
      // else try login
      const res = await axios.post(`${API}/api/login`, { email, password: pass }).then(r=>r.data);
      if(res && res.token){
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        onLogin(res.user);
        return;
      }
      alert('Login/registration failed');
    }catch(err){
      console.error(err);
      alert('Error contacting server');
    }finally{
      setLoading(false);
    }
  }

  return (
    <form className="auth-box" onSubmit={submit}>
      <h3>Sign in / Register</h3>
      <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="password" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
      <div style={{display:'flex', gap:8}}>
        <button className="small" type="submit" disabled={loading}>{loading ? 'Please wait...' : 'Continue'}</button>
      </div>
      <small style={{color:'#64748b'}}>You can register with any email + password.</small>
    </form>
  );
}
