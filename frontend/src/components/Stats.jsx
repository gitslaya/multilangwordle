import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Stats(){
  const [stats, setStats] = useState(null);

  useEffect(()=>{
    const token = localStorage.getItem('token');
    if(!token) return;
    axios.get(`${API}/api/stats`, { headers: { Authorization: 'Bearer ' + token } }).then(r=>{
      setStats(r.data.stats);
    }).catch(()=>{});
  }, []);

  function copySample(){
    const sample = '🟩🟨⬛\n🟩🟩🟩';
    navigator.clipboard.writeText(sample);
    alert('Copied sample share to clipboard');
  }

  return (
    <div className="stats-box">
      <h4>Stats & Share</h4>
      {!stats && <div>No stats (log in and play!)</div>}
      {stats && Object.entries(stats).map(([lang, s])=>(
        <div key={lang} style={{marginBottom:8}}>
          <h5>{lang.toUpperCase()}</h5>
          <div>Total: {s.total} — Wins: {s.wins} — Longest streak: {s.maxStreak}</div>
        </div>
      ))}
      <div style={{marginTop:8}}>
        <button className="small" onClick={copySample}>Copy sample share</button>
      </div>
    </div>
  );
}
