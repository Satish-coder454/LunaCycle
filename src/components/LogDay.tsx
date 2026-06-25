import React, { useState } from 'react';
import { AppState, DailyLog, Screen, FlowLevel } from '../types';
import { dateKey } from '../engine';

interface Props { state: AppState; onSave: (log: DailyLog) => void; onNavigate: (s: Screen) => void; }

const MOODS = [
  {val:'Happy 😊',emoji:'😊'},{val:'Calm 😌',emoji:'😌'},{val:'Energetic ⚡',emoji:'⚡'},
  {val:'Tired 😴',emoji:'😴'},{val:'Anxious 😰',emoji:'😰'},{val:'Irritable 😤',emoji:'😤'},
  {val:'Sad 😔',emoji:'😔'},{val:'Hopeful 🌟',emoji:'🌟'},
];
const SYMPTOMS = ['Cramps','Bloating','Headache','Fatigue','Acne','Back pain','Nausea','Tender breasts','Spotting','Mood swings'];
const FLOWS: FlowLevel[] = ['none','light','medium','heavy'];

export default function LogDay({ state, onSave, onNavigate }: Props) {
  const today = new Date(); today.setHours(0,0,0,0);
  const key = dateKey(today);
  const existing = state.logs[key];

  const [mood, setMood] = useState(existing?.mood || '');
  const [symptoms, setSymptoms] = useState<string[]>(existing?.symptoms || []);
  const [flow, setFlow] = useState<FlowLevel | null>(existing?.flow || null);
  const [energy, setEnergy] = useState(existing?.energy || 5);
  const [sleep, setSleep] = useState(existing?.sleep || 6);
  const [notes, setNotes] = useState(existing?.notes || '');
  const [saved, setSaved] = useState(false);

  const toggleSym = (s: string) => setSymptoms(prev => prev.includes(s) ? prev.filter(x => x!==s) : [...prev, s]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => onSave({ date: key, mood: mood||null, symptoms, flow, energy, sleep, notes }), 600);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid #F5F5F4', flexShrink:0 }}>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'24px', color:'#1C1917', letterSpacing:'-0.3px' }}>Daily log</h2>
        <p style={{ fontSize:'13px', color:'var(--gray-400)', marginTop:'3px' }}>
          {today.toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric'})}
        </p>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'24px' }}>
        {/* Mood */}
        <section>
          <p style={{ fontSize:'13px', fontWeight:600, color:'var(--gray-600)', marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.7px' }}>How are you feeling?</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px' }}>
            {MOODS.map(m => (
              <button key={m.val} onClick={() => setMood(mood===m.val ? '' : m.val)}
                style={{ padding:'10px 6px', borderRadius:'12px', border:`2px solid ${mood===m.val ? '#E8638C' : '#F5F5F4'}`, background: mood===m.val ? '#FDF2F6' : 'white', cursor:'pointer', transition:'all 0.15s', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px' }}>
                <span style={{ fontSize:'22px' }}>{m.emoji}</span>
                <span style={{ fontSize:'10px', color: mood===m.val ? '#9B2252' : '#A8A29E', fontWeight: mood===m.val ? 600 : 400, lineHeight:1.2, textAlign:'center' }}>{m.val.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Flow */}
        <section>
          <p style={{ fontSize:'13px', fontWeight:600, color:'var(--gray-600)', marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.7px' }}>Period flow</p>
          <div style={{ display:'flex', gap:'8px' }}>
            {FLOWS.map(f => (
              <button key={f} onClick={() => setFlow(flow===f ? null : f)}
                style={{ flex:1, padding:'10px 4px', borderRadius:'12px', border:`2px solid ${flow===f ? '#E8638C' : '#F5F5F4'}`, background: flow===f ? '#FDF2F6' : 'white', cursor:'pointer', fontSize:'12px', fontWeight: flow===f ? 600 : 400, color: flow===f ? '#9B2252' : '#A8A29E', textTransform:'capitalize', transition:'all 0.15s' }}>
                {f}
              </button>
            ))}
          </div>
        </section>

        {/* Symptoms */}
        <section>
          <p style={{ fontSize:'13px', fontWeight:600, color:'var(--gray-600)', marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.7px' }}>Symptoms</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
            {SYMPTOMS.map(s => (
              <button key={s} onClick={() => toggleSym(s)}
                style={{ padding:'8px 14px', borderRadius:'20px', border:`2px solid ${symptoms.includes(s) ? '#A78BFA' : '#F5F5F4'}`, background: symptoms.includes(s) ? '#EDE9FE' : 'white', cursor:'pointer', fontSize:'13px', fontWeight: symptoms.includes(s) ? 600 : 400, color: symptoms.includes(s) ? '#7C3AED' : '#78716C', transition:'all 0.15s' }}>
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Energy & Sleep sliders */}
        {[['Energy level','⚡',energy, setEnergy,'#E8638C'],['Sleep quality','😴',sleep, setSleep,'#A78BFA']].map(([label, emoji, val, setter, col]) => (
          <section key={label as string}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
              <p style={{ fontSize:'13px', fontWeight:600, color:'var(--gray-600)', textTransform:'uppercase', letterSpacing:'0.7px' }}>{emoji as string} {label as string}</p>
              <span style={{ fontSize:'15px', fontWeight:700, color:col as string }}>{val as number}<span style={{ fontSize:'11px', color:'var(--gray-400)', fontWeight:400 }}>/10</span></span>
            </div>
            <input type="range" min={1} max={10} value={val as number} onChange={e => (setter as Function)(+e.target.value)}
              style={{ width:'100%', accentColor:col as string, height:'6px', borderRadius:'3px' }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'var(--gray-300)', marginTop:'4px' }}>
              <span>Low</span><span>High</span>
            </div>
          </section>
        ))}

        {/* Notes */}
        <section>
          <p style={{ fontSize:'13px', fontWeight:600, color:'var(--gray-600)', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.7px' }}>Notes</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything else you'd like to note..." rows={3}
            style={{ width:'100%', padding:'13px 14px', border:'2px solid #F5F5F4', borderRadius:'12px', resize:'none', fontSize:'14px', fontFamily:'var(--font-body)', color:'#1C1917', outline:'none', transition:'border 0.15s', lineHeight:1.5 }}
            onFocus={e => e.target.style.borderColor='#E8638C'}
            onBlur={e => e.target.style.borderColor='#F5F5F4'} />
        </section>

        <button onClick={handleSave}
          style={{ width:'100%', padding:'15px', background: saved ? '#2DD4BF' : 'linear-gradient(135deg,#E8638C,#A78BFA)', border:'none', borderRadius:'14px', color:'white', fontSize:'15px', fontWeight:600, cursor:'pointer', transition:'all 0.3s', boxShadow:'var(--shadow-pink)', letterSpacing:'0.2px', marginBottom:'8px' }}>
          {saved ? '✓ Saved!' : 'Save log'}
        </button>
      </div>
    </div>
  );
}
