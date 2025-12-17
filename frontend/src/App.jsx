import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Game from './components/Game';
import LanguageSelector from './components/LanguageSelector';
import Stats from './components/Stats';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function App(){
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('en');
  const [showStats, setShowStats] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(()=>{
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if(t && u) setUser(JSON.parse(u));
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function onLogin(u){
    setUser(u);
  }

  function logout(){
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <div className="app">
      <header>
        <h1>Multilang Wordle - Currently unfunded so give it a minute to load</h1>
<a href="https://cash.app/$YourCashTag" target="_blank" rel="noopener noreferrer">
  <button class="donate-btn">
    Donate to support this project 🙏🙏
  </button>
</a>

        <div className="header-controls">
          <button className="small" onClick={()=>setTheme(t=>{ const next = t==='light'?'dark':'light'; localStorage.setItem('theme', next); document.documentElement.setAttribute('data-theme', next); return next; })}>
            {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
          {user && <LanguageSelector lang={lang} setLang={setLang} />}
          {user && <button className="small" onClick={()=>setShowStats(s=>!s)}>Stats</button>}
          {user && <button className="small" onClick={logout}>Logout</button>}
        </div>
      </header>

      <main>
        {!user ? (
          <Login onLogin={onLogin} />
        ) : (
          <div className="layout">
            <aside className="ad-left">AD LEFT</aside>
            <section className="main-section">
              <Game language={lang} apiBase={API} />
              <div className="ads-placeholder">AD BOTTOM</div>
            </section>
            <aside className="ad-right">AD RIGHT</aside>
          </div>
        )}

        {showStats && user && <Stats apiBase={API} />}
      </main>
    </div>
  );
}
