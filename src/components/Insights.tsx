import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AppState, Screen } from '../types';
import { getPrediction, PHASE_DATA } from '../engine';

interface Props { state: AppState; onNavigate: (s: Screen) => void; }

const TABS = ['Overview','Trends','Phases','Tips'] as const;
type Tab = typeof TABS[number];

export default function Insights({ state, onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>('Overview');
  const pred = useMemo(() => getPrediction(state.lastPeriodDate, state.cycleLength, state.periodLength), [state]);
  const pd = PHASE_DATA[pred.phase];

  const logArr = Object.values(state.logs).sort((a,b) => a.date.localeCompare(b.date));
  const energyData = logArr.slice(-7).map(l => ({ day: new Date(l.date+'T00:00:00').toLocaleDateString('en-US',{weekday:'short'}), energy: l.energy, sleep: l.sleep }));
  const symCounts = logArr.reduce((acc, l) => { l.symptoms.forEach(s => { acc[s] = (acc[s]||0)+1; }); return acc; }, {} as Record<string,number>);
  const topSymptoms = Object.entries(symCounts).sort((a,b) => b[1]-a[1]).slice(0,5);

  const phases = [
    { name:'Menstrual', color:'#E8638C', days: state.periodLength, info:'Uterine lining sheds. Estrogen at its lowest.' },
    { name:'Follicular', color:'#A78BFA', days: 13 - state.periodLength, info:'Follicles develop. Estrogen rises, boosting mood and energy.' },
    { name:'Ovulation', color:'#2DD4BF', days: 2, info:'LH surge triggers egg release. Peak energy and confidence.' },
    { name:'Luteal', color:'#FBBF24', days: state.cycleLength - 16, info:'Progesterone rises. PMS may appear in the second half.' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'20px 20px 0', borderBottom:'1px solid #F5F5F4', flexShrink:0 }}>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'24px', color:'#1C1917', letterSpacing:'-0.3px', marginBottom:'16px' }}>Health insights</h2>
        <div style={{ display:'flex', gap:'6px', overflowX:'auto', paddingBottom:'12px', scrollbarWidth:'none' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:'7px 16px', borderRadius:'20px', border: tab===t ? 'none' : '1px solid #E7E5E4', background: tab===t ? 'linear-gradient(135deg,#E8638C,#A78BFA)' : 'white', color: tab===t ? 'white' : '#78716C', fontSize:'13px', fontWeight: tab===t ? 600 : 400, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.2s' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'14px' }}>

        {tab === 'Overview' && <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            {[
              { label:'Avg cycle', val:`${state.cycleLength}d`, sub:'days', color:'#E8638C', bg:'#FDF2F6' },
              { label:'Days logged', val:logArr.length, sub:'entries', color:'#A78BFA', bg:'#EDE9FE' },
              { label:'Current day', val:pred.cycleDay, sub:`of ${state.cycleLength}`, color:'#2DD4BF', bg:'#CCFBF1' },
              { label:'To next period', val:pred.daysToNextPeriod, sub:'days', color:'#FBBF24', bg:'#FEF3C7' },
            ].map(c => (
              <div key={c.label} style={{ background:c.bg, borderRadius:'16px', padding:'16px' }}>
                <p style={{ fontSize:'11px', fontWeight:600, color:c.color, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:'8px' }}>{c.label}</p>
                <p style={{ fontSize:'32px', fontWeight:700, color:'#1C1917', lineHeight:1 }}>{c.val}</p>
                <p style={{ fontSize:'12px', color:c.color, marginTop:'4px', opacity:0.8 }}>{c.sub}</p>
              </div>
            ))}
          </div>

          <div style={{ background:'white', borderRadius:'16px', padding:'18px', border:'1px solid #F5F5F4' }}>
            <p style={{ fontSize:'13px', fontWeight:600, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:'14px' }}>Current phase</p>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:pd.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px' }}>{pred.phaseEmoji}</div>
              <div>
                <p style={{ fontWeight:600, fontSize:'16px', color:'#1C1917' }}>{pred.phaseName}</p>
                <p style={{ fontSize:'12px', color:'var(--gray-400)' }}>Day {pred.cycleDay} of {state.cycleLength}</p>
              </div>
            </div>
            <p style={{ fontSize:'13px', color:'var(--gray-600)', lineHeight:1.6 }}>{pd.mood}</p>
          </div>

          {topSymptoms.length > 0 && (
            <div style={{ background:'white', borderRadius:'16px', padding:'18px', border:'1px solid #F5F5F4' }}>
              <p style={{ fontSize:'13px', fontWeight:600, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:'14px' }}>Top symptoms</p>
              {topSymptoms.map(([sym, count]) => (
                <div key={sym} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                  <span style={{ fontSize:'13px', color:'#1C1917', flex:1 }}>{sym}</span>
                  <div style={{ flex:2, height:'6px', background:'#F5F5F4', borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'linear-gradient(90deg,#E8638C,#A78BFA)', width:`${Math.round(count/logArr.length*100)}%`, borderRadius:'3px' }} />
                  </div>
                  <span style={{ fontSize:'12px', color:'var(--gray-400)', width:'28px', textAlign:'right' }}>{count}×</span>
                </div>
              ))}
            </div>
          )}
        </>}

        {tab === 'Trends' && <>
          {energyData.length > 0 ? (
            <>
              <div style={{ background:'white', borderRadius:'16px', padding:'18px', border:'1px solid #F5F5F4' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:'14px' }}>Energy this week</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={energyData} barSize={20}>
                    <XAxis dataKey="day" tick={{ fontSize:11, fill:'#A8A29E' }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{ borderRadius:'10px', border:'none', boxShadow:'var(--shadow-md)', fontSize:'12px' }} />
                    <Bar dataKey="energy" fill="#E8638C" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background:'white', borderRadius:'16px', padding:'18px', border:'1px solid #F5F5F4' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:'14px' }}>Sleep this week</p>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={energyData}>
                    <XAxis dataKey="day" tick={{ fontSize:11, fill:'#A8A29E' }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{ borderRadius:'10px', border:'none', boxShadow:'var(--shadow-md)', fontSize:'12px' }} />
                    <Line type="monotone" dataKey="sleep" stroke="#A78BFA" strokeWidth={2.5} dot={{ fill:'#A78BFA', r:4 }}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'60px 20px' }}>
              <div style={{ fontSize:'48px', marginBottom:'16px' }}>📊</div>
              <p style={{ fontFamily:'var(--font-display)', fontSize:'20px', color:'#1C1917', marginBottom:'8px' }}>No trends yet</p>
              <p style={{ color:'var(--gray-400)', fontSize:'14px', lineHeight:1.6 }}>Log a few days to start seeing your energy and sleep patterns here.</p>
              <button onClick={() => onNavigate('log')} style={{ marginTop:'20px', padding:'11px 22px', background:'linear-gradient(135deg,#E8638C,#A78BFA)', color:'white', border:'none', borderRadius:'12px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Log today</button>
            </div>
          )}
        </>}

        {tab === 'Phases' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {phases.map(p => (
              <div key={p.name} style={{ background:'white', borderRadius:'16px', padding:'16px', border:'1px solid #F5F5F4' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                  <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:p.color, flexShrink:0 }} />
                  <span style={{ fontWeight:600, fontSize:'14px', color:'#1C1917', flex:1 }}>{p.name}</span>
                  <span style={{ fontSize:'12px', color:'var(--gray-400)' }}>{p.days} days</span>
                </div>
                <div style={{ background:'#F5F5F4', borderRadius:'4px', height:'6px', overflow:'hidden', marginBottom:'10px' }}>
                  <div style={{ height:'100%', background:p.color, width:`${Math.round(p.days/state.cycleLength*100)}%`, borderRadius:'4px' }} />
                </div>
                <p style={{ fontSize:'13px', color:'var(--gray-500)', lineHeight:1.5 }}>{p.info}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'Tips' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {[
              { emoji:'🥗', title:'Nutrition', body:pd.diet, bg:'#FDF2F6', accent:'#E8638C' },
              { emoji:'🏃', title:'Workout', body:pd.workout, bg:'#EDE9FE', accent:'#A78BFA' },
              { emoji:'🧘', title:'Mind & mood', body:pd.mood, bg:'#CCFBF1', accent:'#2DD4BF' },
              { emoji:'💡', title:'Productivity', body:`${pred.phaseName} is ideal for: ${pred.phase==='follicular'||pred.phase==='ovulation'?'starting projects, socialising, and high-performance tasks.':'finishing tasks, solo focus work, and self-care.'}`, bg:'#FEF3C7', accent:'#D97706' },
            ].map(c => (
              <div key={c.title} style={{ background:c.bg, borderRadius:'16px', padding:'16px', display:'flex', gap:'14px', alignItems:'flex-start' }}>
                <div style={{ width:'42px', height:'42px', borderRadius:'10px', background:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>{c.emoji}</div>
                <div>
                  <p style={{ fontWeight:700, fontSize:'14px', color:c.accent, marginBottom:'4px' }}>{c.title}</p>
                  <p style={{ fontSize:'13px', color:'#57534E', lineHeight:1.6 }}>{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
