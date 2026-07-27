import React, { useState } from 'react';
import { TrackingMode } from '../types';
import { addDays, dateKey } from '../engine';

interface Props { onFinish: (name: string, mode: TrackingMode, lastPeriod: Date, cycleLen: number, periodLen: number) => void; }

const today = new Date(); today.setHours(0,0,0,0);

export default function Onboarding({ onFinish }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<TrackingMode>('period');
  const [lastPeriod, setLastPeriod] = useState(dateKey(addDays(today,-14)));
  const [cycleLen, setCycleLen] = useState(28);
  const [periodLen, setPeriodLen] = useState(5);
  const [showSuitabilityCheck, setShowSuitabilityCheck] = useState(false);
  const commonlyMasculineNames = new Set(['aarav','aditya','ajay','akash','amit','arjun','ashish','daniel','david','john','joseph','michael','mohammed','rahul','raj','rohan','ryan','samuel','satish','vijay']);
  const mayNeedSuitabilityCheck = commonlyMasculineNames.has(name.trim().toLocaleLowerCase().split(/\s+/)[0]);

  const steps = [
    { label: '01', title: 'Welcome to Luna', sub: 'Your intelligent menstrual health companion' },
    { label: '02', title: 'What\'s your name?', sub: 'Personalize your experience' },
    { label: '03', title: 'Choose your mode', sub: 'We\'ll tailor insights just for you' },
    { label: '04', title: 'Your cycle details', sub: 'This helps us predict accurately' },
  ];

  const canNext = step === 0 || (step === 1 && name.trim()) || step === 2 || step === 3;

  const handleNext = () => {
    if (step === 1 && mayNeedSuitabilityCheck && !showSuitabilityCheck) {
      setShowSuitabilityCheck(true);
      return;
    }
    if (step < 3) setStep(s => s + 1);
    else onFinish(name.trim() || 'there', mode, new Date(lastPeriod + 'T00:00:00'), cycleLen, periodLen);
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #FDF2F6 0%, #EDE9FE 50%, #CCFBF1 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', fontFamily:'var(--font-body)' }}>
      <div style={{ width:'100%', maxWidth:'480px' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'48px' }}>
          <div style={{ width:'72px', height:'72px', background:'linear-gradient(135deg, #E8638C, #A78BFA)', borderRadius:'22px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 12px 40px rgba(232,99,140,0.35)' }}>
            <span style={{ fontSize:'36px' }}>🌙</span>
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'32px', color:'#9B2252', letterSpacing:'-0.5px' }}>Luna</div>
        </div>

        {/* Step indicator */}
        <div style={{ display:'flex', gap:'6px', marginBottom:'32px', justifyContent:'center' }}>
          {steps.map((_,i) => (
            <div key={i} style={{ height:'3px', flex:1, maxWidth:'60px', borderRadius:'2px', background: i <= step ? 'linear-gradient(90deg,#E8638C,#A78BFA)' : 'rgba(0,0,0,0.12)', transition:'background 0.3s' }} />
          ))}
        </div>

        {/* Card */}
        <div style={{ background:'white', borderRadius:'28px', padding:'40px', boxShadow:'0 20px 60px rgba(0,0,0,0.1)' }}>
          <div style={{ color:'#E8638C', fontSize:'11px', fontWeight:600, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'8px' }}>{steps[step].label}</div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'28px', color:'#1C1917', marginBottom:'6px', lineHeight:1.2 }}>{steps[step].title}</h2>
          <p style={{ color:'var(--gray-500)', marginBottom:'32px', fontSize:'15px' }}>{steps[step].sub}</p>

          {step === 0 && (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <p style={{ fontSize:'16px', color:'var(--gray-600)', lineHeight:1.7 }}>Track your cycle, understand your body, and get personalized AI insights — all in one beautiful, private space.</p>
              <div style={{ display:'flex', gap:'12px', justifyContent:'center', marginTop:'24px', flexWrap:'wrap' }}>
                {['AI predictions','Phase insights','Mood tracking','Private & secure'].map(f => (
                  <span key={f} style={{ background:'#FDF2F6', color:'#9B2252', borderRadius:'20px', padding:'6px 14px', fontSize:'12px', fontWeight:500 }}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <>
            <input value={name} onChange={e => { setName(e.target.value); setShowSuitabilityCheck(false); }} placeholder="Your first name" autoFocus
              onKeyDown={e => e.key==='Enter' && name.trim() && handleNext()}
              style={{ width:'100%', padding:'14px 18px', border:'2px solid #FAD9E8', borderRadius:'12px', fontSize:'16px', outline:'none', transition:'border 0.2s', color:'#1C1917', background:'#FAFAF9' }}
              onFocus={e => e.target.style.borderColor='#E8638C'}
              onBlur={e => e.target.style.borderColor='#FAD9E8'} />
            {showSuitabilityCheck && (
              <div role="alert" style={{ marginTop:'14px', padding:'14px', borderRadius:'12px', background:'#FEF3C7', color:'#92400E', fontSize:'13px', lineHeight:1.5 }}>
                <strong>Quick check</strong><br/>
                Luna is designed for people who menstruate or who are tracking on someone else's behalf. Names cannot reliably determine gender. If this is the right tracker for you, continue; otherwise edit the name.
                <div style={{ display:'flex', gap:'8px', marginTop:'10px' }}>
                  <button onClick={() => { setShowSuitabilityCheck(false); setStep(2); }} style={{ padding:'8px 12px', borderRadius:'9px', background:'#92400E', color:'white' }}>Continue</button>
                  <button onClick={() => setShowSuitabilityCheck(false)} style={{ padding:'8px 12px', borderRadius:'9px', background:'white', color:'#92400E' }}>Edit name</button>
                </div>
              </div>
            )}
            </>
          )}

          {step === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {([['period','Period Tracking','Track your cycle & symptoms 🩸'],['conceive','Trying to Conceive','Fertility & ovulation tracking ✨'],['pregnancy','Pregnancy Mode','Week-by-week pregnancy journey 🤰']] as const).map(([val, label, desc]) => (
                <div key={val} onClick={() => setMode(val as TrackingMode)}
                  style={{ padding:'16px 18px', borderRadius:'14px', border:`2px solid ${mode===val?'#E8638C':'#F5F5F4'}`, background: mode===val?'#FDF2F6':'white', cursor:'pointer', transition:'all 0.2s' }}>
                  <div style={{ fontWeight:600, color: mode===val?'#9B2252':'#1C1917', marginBottom:'2px' }}>{label}</div>
                  <div style={{ fontSize:'13px', color:'var(--gray-500)' }}>{desc}</div>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
              <div>
                <label style={{ display:'block', fontWeight:500, color:'var(--gray-700)', marginBottom:'8px', fontSize:'13px' }}>Last period start date</label>
                <input type="date" value={lastPeriod} onChange={e => setLastPeriod(e.target.value)} max={dateKey(today)}
                  style={{ width:'100%', padding:'13px 16px', border:'2px solid #FAD9E8', borderRadius:'12px', fontSize:'15px', outline:'none', color:'#1C1917', background:'#FAFAF9' }}
                  onFocus={e => e.target.style.borderColor='#E8638C'} onBlur={e => e.target.style.borderColor='#FAD9E8'} />
              </div>
              <div>
                <label style={{ display:'block', fontWeight:500, color:'var(--gray-700)', marginBottom:'8px', fontSize:'13px' }}>Average cycle length: <span style={{ color:'#E8638C', fontWeight:700 }}>{cycleLen} days</span></label>
                <input type="range" min={21} max={45} value={cycleLen} onChange={e => setCycleLen(+e.target.value)}
                  style={{ width:'100%', height:'6px', accentColor:'#E8638C', borderRadius:'3px' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'var(--gray-400)', marginTop:'4px' }}>
                  <span>21 days</span><span>45 days</span>
                </div>
              </div>
              <div>
                <label style={{ display:'block', fontWeight:500, color:'var(--gray-700)', marginBottom:'8px', fontSize:'13px' }}>Typical period length: <span style={{ color:'#E8638C', fontWeight:700 }}>{periodLen} days</span></label>
                <input type="range" min={2} max={10} value={periodLen} onChange={e => setPeriodLen(+e.target.value)}
                  style={{ width:'100%', height:'6px', accentColor:'#E8638C', borderRadius:'3px' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'var(--gray-400)', marginTop:'4px' }}>
                  <span>2 days</span><span>10 days</span>
                </div>
              </div>
            </div>
          )}

          <button onClick={handleNext} disabled={!canNext}
            style={{ width:'100%', marginTop:'32px', padding:'15px', background: canNext ? 'linear-gradient(135deg, #E8638C, #A78BFA)' : '#F5F5F4', color: canNext ? 'white' : '#A8A29E', border:'none', borderRadius:'14px', fontSize:'15px', fontWeight:600, cursor: canNext ? 'pointer' : 'not-allowed', transition:'all 0.2s', boxShadow: canNext ? 'var(--shadow-pink)' : 'none', letterSpacing:'0.2px' }}>
            {step < 3 ? 'Continue →' : 'Start tracking 🌙'}
          </button>
        </div>
      </div>
    </div>
  );
}
