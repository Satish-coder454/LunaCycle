import React, { useState, useMemo } from 'react';
import { AppState, Screen } from '../types';
import { getDayClass, getPrediction, PHASE_DATA, dateKey, addDays } from '../engine';

interface Props { state: AppState; onNavigate: (s: Screen) => void; }

export default function CalendarView({ state, onNavigate }: Props) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(today);
  const pred = useMemo(() => getPrediction(state.lastPeriodDate, state.cycleLength, state.periodLength), [state]);

  const daysInMonth = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();

  const selectedKey = selectedDay ? dateKey(selectedDay) : null;
  const selectedLog = selectedKey ? state.logs[selectedKey] : null;

  const getDayInfo = (date: Date) => {
    const diff = Math.round((date.getTime() - state.lastPeriodDate.getTime()) / 86400000);
    const pos = ((diff % state.cycleLength) + state.cycleLength) % state.cycleLength;
    const day = pos + 1;
    let phase = '';
    if (pos < state.periodLength) phase = 'menstrual';
    else if (pos <= state.cycleLength - 14) phase = 'follicular';
    else if (pos <= state.cycleLength - 12) phase = 'ovulation';
    else phase = 'luteal';
    return { day, phase };
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div style={{ padding:'20px 20px 0', borderBottom:'1px solid #F5F5F4', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'24px', color:'#1C1917', letterSpacing:'-0.3px' }}>
              {month.toLocaleDateString('en-US',{month:'long',year:'numeric'})}
            </h2>
            <p style={{ fontSize:'12px', color:'var(--gray-400)', marginTop:'2px' }}>Cycle day {pred.cycleDay}</p>
          </div>
          <div style={{ display:'flex', gap:'6px' }}>
            {[-1,1].map(d => (
              <button key={d} onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth()+d, 1))}
                style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#F5F5F4', border:'none', fontSize:'16px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#57534E' }}>
                {d === -1 ? '‹' : '›'}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:'12px', overflowX:'auto', paddingBottom:'12px', scrollbarWidth:'none' }}>
          {[['#E8638C','Period'],['#A78BFA','Fertile'],['#2DD4BF','Ovulation'],['#FAD9E8','Predicted'],['#2DD4BF','Logged']] .map(([c,l]) => (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:'4px', flexShrink:0 }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:c }} />
              <span style={{ fontSize:'11px', color:'var(--gray-500)', whiteSpace:'nowrap' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
        {/* Day labels */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:'4px' }}>
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <div key={d} style={{ textAlign:'center', fontSize:'11px', fontWeight:600, color:'var(--gray-400)', padding:'4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
          {Array(firstDay).fill(null).map((_,i) => <div key={'e'+i} />)}
          {Array(daysInMonth).fill(null).map((_,i) => {
            const date = new Date(month.getFullYear(), month.getMonth(), i+1);
            const classes = getDayClass(date, state.lastPeriodDate, state.cycleLength, state.periodLength, state.logs);
            const isSel = selectedDay && dateKey(date) === dateKey(selectedDay);
            const isToday = dateKey(date) === dateKey(today);
            const isPeriod = classes.includes('period');
            const isOvulation = classes.includes('ovulation');
            const isFertile = classes.includes('fertile');
            const isPredicted = classes.includes('predicted');
            const isLogged = classes.includes('logged');

            let bg = 'transparent';
            let textColor = '#1C1917';
            let borderStyle = 'none';

            if (isSel && !isPeriod && !isOvulation) { bg = '#FDF2F6'; borderStyle = '2px solid #E8638C'; }
            else if (isPeriod) { bg = '#E8638C'; textColor = 'white'; }
            else if (isOvulation) { bg = '#2DD4BF'; textColor = 'white'; }
            else if (isFertile) { bg = '#EDE9FE'; textColor = '#7C3AED'; }
            else if (isPredicted) { bg = '#FAD9E8'; textColor = '#9B2252'; }

            if (isToday && !isPeriod && !isOvulation) { borderStyle = `2px solid #E8638C`; textColor = '#E8638C'; }

            return (
              <div key={i+1} onClick={() => setSelectedDay(date)}
                style={{ aspectRatio:'1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background:bg, border:borderStyle, position:'relative', transition:'all 0.15s', fontWeight: isToday ? 700 : 400 }}>
                <span style={{ fontSize:'13px', color:textColor, fontWeight: isPeriod||isOvulation ? 600 : isToday ? 700 : 400 }}>{i+1}</span>
                {isLogged && <div style={{ position:'absolute', bottom:'2px', left:'50%', transform:'translateX(-50%)', width:'4px', height:'4px', borderRadius:'50%', background: isPeriod||isOvulation ? 'white' : '#2DD4BF' }} />}
              </div>
            );
          })}
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <div style={{ marginTop:'20px', background:'white', border:'1px solid #F5F5F4', borderRadius:'18px', padding:'18px', boxShadow:'var(--shadow-sm)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
              <div>
                <p style={{ fontWeight:600, fontSize:'15px', color:'#1C1917' }}>
                  {selectedDay.toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric'})}
                </p>
                {(() => { const { day, phase } = getDayInfo(selectedDay); const pd = PHASE_DATA[phase as keyof typeof PHASE_DATA]; return (
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'4px' }}>
                    <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:pd?.color || '#E8638C' }} />
                    <p style={{ fontSize:'12px', color:'var(--gray-500)' }}>Day {day} · {pd?.label || 'Unknown'} phase</p>
                  </div>
                ); })()}
              </div>
              {dateKey(selectedDay) === dateKey(today) && (
                <button onClick={() => onNavigate('log')}
                  style={{ background:'linear-gradient(135deg,#E8638C,#A78BFA)', color:'white', border:'none', borderRadius:'10px', padding:'7px 14px', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                  Log day
                </button>
              )}
            </div>

            {selectedLog ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {selectedLog.mood && <div style={{ display:'flex', gap:'8px', alignItems:'center' }}><span style={{ fontSize:'11px', color:'var(--gray-400)', width:'60px' }}>Mood</span><span style={{ fontSize:'13px', color:'#1C1917', fontWeight:500 }}>{selectedLog.mood}</span></div>}
                {selectedLog.symptoms.length > 0 && <div style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}><span style={{ fontSize:'11px', color:'var(--gray-400)', width:'60px', paddingTop:'2px' }}>Symptoms</span><div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>{selectedLog.symptoms.map(s => <span key={s} style={{ background:'#FAD9E8', color:'#9B2252', borderRadius:'12px', padding:'2px 8px', fontSize:'11px' }}>{s}</span>)}</div></div>}
                {selectedLog.flow && <div style={{ display:'flex', gap:'8px', alignItems:'center' }}><span style={{ fontSize:'11px', color:'var(--gray-400)', width:'60px' }}>Flow</span><span style={{ fontSize:'13px', color:'#1C1917', fontWeight:500 }}>{selectedLog.flow}</span></div>}
                {selectedLog.energy > 0 && <div style={{ display:'flex', gap:'8px', alignItems:'center' }}><span style={{ fontSize:'11px', color:'var(--gray-400)', width:'60px' }}>Energy</span><span style={{ fontSize:'13px', color:'#1C1917', fontWeight:500 }}>{selectedLog.energy}/10</span></div>}
              </div>
            ) : (
              <p style={{ fontSize:'13px', color:'var(--gray-400)' }}>No log for this day yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
