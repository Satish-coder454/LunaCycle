import React, { useMemo } from 'react';
import { AppState, Screen } from '../types';
import { getPrediction, PHASE_DATA } from '../engine';

interface Props { state: AppState; onNavigate: (s: Screen) => void; }

export default function Home({ state, onNavigate }: Props) {
  const pred = useMemo(() => getPrediction(state.lastPeriodDate, state.cycleLength, state.periodLength), [state]);
  const pd = PHASE_DATA[pred.phase];
  const circumference = 2 * Math.PI * 52;
  const progress = circumference - (pred.cycleDay / pred.cycleLength) * circumference;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const tiles = [
    { label:'Days to period', value: pred.daysToNextPeriod, unit:'days', color:'#FDF2F6', accent:'#E8638C' },
    { label:'Cycle day', value: pred.cycleDay, unit:`/ ${pred.cycleLength}`, color:'#EDE9FE', accent:'#A78BFA' },
    { label:'Prediction', value: `${Math.round(pred.confidence*100)}%`, unit:'accuracy', color:'#CCFBF1', accent:'#2DD4BF' },
  ];

  const today = new Date();

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100%' }}>
      {/* Gradient header */}
      <div style={{ background:`linear-gradient(160deg, ${pd.color}22 0%, ${pd.color}08 100%)`, padding:'24px 20px 20px', borderBottom:'1px solid #F5F5F4', flexShrink:0 }}>
        {/* Top row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'28px' }}>
          <div>
            <p style={{ fontSize:'13px', color:'var(--gray-500)', marginBottom:'2px' }}>{greeting},</p>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'26px', color:'#1C1917', lineHeight:1.1, letterSpacing:'-0.3px' }}>{state.userName} 👋</h1>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ background:pd.bg, border:`1px solid ${pd.color}40`, borderRadius:'20px', padding:'5px 12px', display:'inline-flex', alignItems:'center', gap:'5px' }}>
              <span style={{ fontSize:'14px' }}>{pred.phaseEmoji}</span>
              <span style={{ fontSize:'11px', fontWeight:600, color:pd.text }}>{pred.phaseName}</span>
            </div>
            <p style={{ fontSize:'11px', color:'var(--gray-400)', marginTop:'4px' }}>{today.toLocaleDateString('en-IN',{month:'long',day:'numeric'})}</p>
          </div>
        </div>

        {/* Ring + stats */}
        <div style={{ display:'flex', alignItems:'center', gap:'24px' }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <svg width="128" height="128" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="52" fill="none" stroke="#F5F5F4" strokeWidth="10"/>
              <circle cx="64" cy="64" r="52" fill="none" stroke={pd.color} strokeWidth="10"
                strokeDasharray={circumference} strokeDashoffset={progress}
                strokeLinecap="round" transform="rotate(-90 64 64)" style={{ transition:'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}/>
              <circle cx="64" cy="64" r="42" fill="white"/>
              <text x="64" y="57" textAnchor="middle" fontSize="28" fontWeight="700" fill="#1C1917">{pred.cycleDay}</text>
              <text x="64" y="72" textAnchor="middle" fontSize="10" fill="#A8A29E">day {pred.cycleDay}</text>
              <text x="64" y="84" textAnchor="middle" fontSize="10" fill={pd.color} fontWeight="600">{pred.phaseName}</text>
            </svg>
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'8px' }}>
            {tiles.map(t => (
              <div key={t.label} style={{ background:t.color, borderRadius:'12px', padding:'10px 14px' }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:'4px' }}>
                  <span style={{ fontSize:'22px', fontWeight:700, color:t.accent, fontVariantNumeric:'tabular-nums' }}>{t.value}</span>
                  <span style={{ fontSize:'10px', color:t.accent, fontWeight:500 }}>{t.unit}</span>
                </div>
                <p style={{ fontSize:'11px', color:t.accent, opacity:0.75, marginTop:'1px' }}>{t.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'16px' }}>
        {/* Phase strip */}
        <div>
          <p style={{ fontSize:'12px', fontWeight:600, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'10px' }}>Cycle phases</p>
          <div style={{ display:'flex', height:'8px', borderRadius:'4px', overflow:'hidden', gap:'2px' }}>
            {([['menstrual',1.5,'#E8638C'],['follicular',2,'#A78BFA'],['ovulation',0.5,'#2DD4BF'],['luteal',2,'#FBBF24']] as const).map(([p,f,c]) => (
              <div key={p} style={{ flex:f, background:c, opacity: pred.phase===p ? 1 : 0.35, transition:'opacity 0.3s', borderRadius:'2px', boxShadow: pred.phase===p ? `0 0 8px ${c}88` : 'none' }} />
            ))}
          </div>
          <div style={{ display:'flex', gap:'12px', marginTop:'8px', flexWrap:'wrap' }}>
            {([['Menstrual','#E8638C'],['Follicular','#A78BFA'],['Ovulation','#2DD4BF'],['Luteal','#FBBF24']] as const).map(([l,c]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:c }} />
                <span style={{ fontSize:'11px', color:'var(--gray-500)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today card */}
        <div style={{ background:`linear-gradient(135deg, ${pd.bg} 0%, white 100%)`, border:`1px solid ${pd.color}30`, borderRadius:'18px', padding:'18px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', right:'-10px', top:'-10px', fontSize:'60px', opacity:0.12 }}>{pred.phaseEmoji}</div>
          <p style={{ fontSize:'11px', fontWeight:600, color:pd.text, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>Phase insight</p>
          <p style={{ fontSize:'15px', fontWeight:500, color:'#1C1917', lineHeight:1.5, marginBottom:'8px' }}>{pd.tip}</p>
          <p style={{ fontSize:'13px', color:'var(--gray-500)', lineHeight:1.6 }}>{pd.mood}</p>
        </div>

        {/* Quick cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
          {[
            { emoji:'🏃', label:'Workout', val:pd.workout.split(',')[0], bg:'#FDF2F6', accent:'#E8638C' },
            { emoji:'🥗', label:'Nutrition', val:pd.diet.split(':')[0], bg:'#EDE9FE', accent:'#A78BFA' },
            { emoji:'😴', label:'Sleep tip', val:'Track energy & sleep quality daily', bg:'#CCFBF1', accent:'#2DD4BF' },
            { emoji:'💊', label:'Hormones', val:pd.hormone, bg:'#FEF3C7', accent:'#D97706' },
          ].map(c => (
            <div key={c.label} style={{ background:c.bg, borderRadius:'14px', padding:'14px' }}>
              <div style={{ fontSize:'20px', marginBottom:'6px' }}>{c.emoji}</div>
              <p style={{ fontSize:'11px', fontWeight:700, color:c.accent, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>{c.label}</p>
              <p style={{ fontSize:'12px', color:'var(--gray-600)', lineHeight:1.4 }}>{c.val}</p>
            </div>
          ))}
        </div>

        {/* Next period */}
        <div style={{ background:'linear-gradient(135deg, #E8638C, #A78BFA)', borderRadius:'18px', padding:'18px 20px', color:'white' }}>
          <p style={{ fontSize:'11px', opacity:0.8, fontWeight:500, marginBottom:'6px', textTransform:'uppercase', letterSpacing:'1px' }}>Next period predicted</p>
          <div style={{ display:'flex', alignItems:'baseline', gap:'8px', marginBottom:'4px' }}>
            <span style={{ fontFamily:'var(--font-display)', fontSize:'24px' }}>
              {pred.nextPeriodDate.toLocaleDateString('en-IN',{month:'long',day:'numeric'})}
            </span>
          </div>
          <p style={{ fontSize:'13px', opacity:0.85 }}>
            {pred.daysToNextPeriod === 0 ? 'Today! 🩸' : `In ${pred.daysToNextPeriod} day${pred.daysToNextPeriod===1?'':'s'}`} · Fertile window {pred.fertileStart.toLocaleDateString('en-IN',{month:'short',day:'numeric'})}–{pred.fertileEnd.toLocaleDateString('en-IN',{month:'short',day:'numeric'})}
          </p>
        </div>

        <button onClick={() => onNavigate('log')}
          style={{ width:'100%', padding:'14px', background:'white', border:'2px solid #FAD9E8', borderRadius:'14px', fontSize:'14px', fontWeight:600, color:'#E8638C', cursor:'pointer', marginBottom:'4px' }}>
          Log today's symptoms ✦
        </button>
      </div>
    </div>
  );
}
