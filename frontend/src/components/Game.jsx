import React, { useState, useEffect } from 'react';
import Keyboard from './Keyboard';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Game({ language }) {
  const [grid, setGrid] = useState(Array.from({length:6}, ()=>Array.from({length:5}, ()=>'')));
  const [marks, setMarks] = useState(Array.from({length:6}, ()=>Array.from({length:5}, ()=>'')));
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState(null);
  const [keyColors, setKeyColors] = useState({});

  // 🟦 NEW: definition modal state
  const [definition, setDefinition] = useState('');
  const [showDef, setShowDef] = useState(false);

  useEffect(()=>{
    axios.get(`${API}/api/day-word/${language}`)
      .then(r => setAnswer((r.data.word||'').toLowerCase()))
      .catch(()=>setAnswer(''));

    setGrid(Array.from({length:6}, ()=>Array.from({length:5}, ()=>'')));
    setMarks(Array.from({length:6}, ()=>Array.from({length:5}, ()=>'')));
    setRow(0);
    setCol(0);
    setStatus(null);
    setKeyColors({});
    setShowDef(false);
    setDefinition('');
  }, [language]);

  // 🟦 NEW: fetch definition
  async function fetchDefinition(word) {

  async function tryLookup(w) {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/${language}/${encodeURIComponent(w)}`
    );
    if (!res.ok) throw new Error('not found');
    const data = await res.json();
    return data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition;
  }

  try {
    // 1️⃣ Try original word
    const def = await tryLookup(word);
    if (def) {
      setDefinition(def);
      return;
    }
  } catch {}

  // 2️⃣ If ends with "s", try singular
  if (word.endsWith('s') && word.length > 3) {
    try {
      const singular = word.slice(0, -1);
      const def2 = await tryLookup(singular);
      if (def2) {
        setDefinition(def2 + ' (base form)');
        return;
      }
    } catch {}
  }

  // 3️⃣ Fallback
  setDefinition('Definition not available.');
}

  function addLetter(l){
    if(status) return;
    if(col >= 5) return;
    const g = grid.map(r=>r.slice());
    g[row][col] = l;
    setGrid(g);
    setCol(col+1);
  }

  function del(){
    if(status) return;
    if(col === 0) return;
    const g = grid.map(r=>r.slice());
    g[row][col-1] = '';
    setGrid(g);
    setCol(col-1);
  }

  async function submit(){
    if(col !== 5) return alert('Need 5 letters');
    const guess = grid[row].join('');

    try{
      const validRes = await axios.get(
        `${API}/api/validate/${language}/${encodeURIComponent(guess)}`
      );
      if(!validRes.data.valid){
        alert('Not in word list');
        return;
      }
    }catch{
      alert('Validation failed');
      return;
    }

    const ansArr = (answer||'').split('');
    const guessArr = guess.split('');
    const rowMarks = Array(5).fill('absent');

    for(let i=0;i<5;i++){
      if(guessArr[i] === ansArr[i]){
        rowMarks[i] = 'correct';
        ansArr[i] = null;
      }
    }
    for(let i=0;i<5;i++){
      if(rowMarks[i] === 'correct') continue;
      const idx = ansArr.indexOf(guessArr[i]);
      if(idx !== -1){
        rowMarks[i] = 'present';
        ansArr[idx] = null;
      }
    }

    const newMarks = marks.map(r=>r.slice());
    newMarks[row] = rowMarks;
    setMarks(newMarks);

    const order = {'':0, 'grey':1, 'yellow':2, 'green':3};
    const newKeyColors = {...keyColors};
    for(let i=0;i<5;i++){
      const ch = guessArr[i];
      const cur = newKeyColors[ch] || '';
      const next =
        rowMarks[i] === 'correct'
          ? 'green'
          : rowMarks[i] === 'present'
          ? 'yellow'
          : 'grey';
      if(order[next] > order[cur]) newKeyColors[ch] = next;
    }
    setKeyColors(newKeyColors);

    // 🟩 WIN
    if(guess === answer){
      setStatus('won');
      fetchDefinition(answer);
      setShowDef(true);

      const token = localStorage.getItem('token');
      if(token){
        axios.post(
          `${API}/api/result`,
          { date: new Date().toISOString().slice(0,10), language, attempts: row+1, won:true },
          { headers: { Authorization: 'Bearer ' + token } }
        ).catch(()=>{});
      }
      return;
    }

    // 🟥 LOSS
    if(row === 5){
      setStatus('lost');
      fetchDefinition(answer);
      setShowDef(true);

      const token = localStorage.getItem('token');
      if(token){
        axios.post(
          `${API}/api/result`,
          { date: new Date().toISOString().slice(0,10), language, attempts: 7, won:false },
          { headers: { Authorization: 'Bearer ' + token } }
        ).catch(()=>{});
      }
      return;
    }

    setRow(row+1);
    setCol(0);
  }

  useEffect(()=>{
    function handler(e){
      if(e.key === 'Enter') submit();
      else if(e.key === 'Backspace') del();
      else if(e.key.length === 1) addLetter(e.key);
    }
    window.addEventListener('keydown', handler);
    return ()=> window.removeEventListener('keydown', handler);
  }, [grid, row, col, answer, marks, keyColors]);

  function onKey(k){
    if(k === 'ENTER') submit();
    else if(k === 'DEL') del();
    else addLetter(k);
  }

  return (
    <div className="board-wrap" aria-live="polite">
      <div style={{marginBottom:6}}>
        <strong>Language:</strong> {language.toUpperCase()}
        <small style={{marginLeft:10,color:'#64748b'}}>
          Accents required for Spanish/French
        </small>
      </div>

      <div className="board">
        {grid.map((r,ri)=>(
          <div className="row" key={ri}>
            {r.map((c,ci)=>(
              <div key={ci} className={`tile ${marks[ri][ci] || ''}`}>
                {c}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="controls">
        <div className="input-row">
          <input className="guess" value={grid[row].join('')} readOnly />
          <button className="small" onClick={submit}>Enter</button>
        </div>
        <Keyboard onKey={onKey} keyColors={keyColors} lang={language} />
      </div>

      {/* 🟦 Definition Modal */}
      {showDef && (
        <div className="definition-modal">
          <div>
            <h3>{answer.toUpperCase()}</h3>
            <p>{definition}</p>
            <button className="small" onClick={()=>setShowDef(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
