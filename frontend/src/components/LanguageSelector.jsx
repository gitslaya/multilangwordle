import React, { useState } from 'react';

export default function LanguageSelector({ lang, setLang }){
  const [open, setOpen] = useState(false);
  const langs = [{code:'en',label:'English'},{code:'es',label:'Español'},{code:'fr',label:'Français'}];

  return (
    <div style={{position:'relative'}}>
      <button className="small" onClick={()=>setOpen(o=>!o)}>Language: {lang.toUpperCase()}</button>
      {open && <div className="lang-list" style={{marginTop:8}}>
        {langs.map(l=>(
          <div key={l.code} style={{padding:'6px 8px'}}>
            <button className="small" onClick={()=>{ setLang(l.code); setOpen(false); }}>{l.label}</button>
          </div>
        ))}
      </div>}
    </div>
  );
}
