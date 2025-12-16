import React from 'react';

/*
  Renders keyboard rows based on language.
  keyColors: map letter -> 'grey'|'yellow'|'green'
  onKey: function(letter) where letter may be accented, 'ENTER', or 'DEL'
*/

export default function Keyboard({ onKey, keyColors = {}, lang = 'en' }){
  const layouts = {
    en: ['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'],
    es: ['QWERTYUIOP','ASDFGHJKLÑ','ÁÉÍÓÚÜ'],
    fr: ['AZERTYUIOP','QSDFGHJKLM','WXCVBNÉÈÊË','ÇÀÂÎÏÔÙÛÜ']
  };

  const rows = layouts[lang] || layouts.en;

  return (
    <div className="keyboard" role="application" aria-label="keyboard">
      {rows.map((r,ri) => (
        <div className="krow" key={ri}>
          {Array.from(r).map(c=>{
            const cls = keyColors[c] || keyColors[c.toLowerCase()] || '';
            // give bigger class for visual polish
            return <button key={c} className={`key big ${cls}`} onClick={()=>onKey(c)}>{c}</button>
          })}
          {ri === rows.length - 1 && (
            <>
              <button className="key big" style={{minWidth:96}} onClick={()=>onKey('ENTER')}>ENTER</button>
              <button className="key big" style={{minWidth:96}} onClick={()=>onKey('DEL')}>DEL</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
