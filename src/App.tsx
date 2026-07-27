import React, { useEffect, useState } from 'react';
import {
  CalendarDays, ChartNoAxesCombined, ChevronLeft, ChevronRight, Download, Droplets,
  HeartPulse, Home, LockKeyhole, Moon, Plus, Settings as SettingsIcon, ShieldCheck,
  Sparkles, Trash2
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AppState, DailyLog, FlowLevel, Phase, Settings } from './types';
import {
  addDays, cycleLengthsFromStarts, dateKey, daysBetween, getMoonPhase, nextPredictions, smartCycleLength
} from './engine';
import './index.css';

const STORE = 'luna-cycle-private-v2';
const today = new Date(); today.setHours(0, 0, 0, 0);
const defaultSettings: Settings = { darkMode: true, periodReminder: true, ovulationReminder: false, logReminder: true, units: 'metric', storage: 'local' };
const emptyState: AppState = {
  userName: '', mode: 'period', lastPeriodDate: addDays(today, -14), cycleLength: 28, periodLength: 5,
  logs: {}, periodStarts: [], settings: defaultSettings, currentScreen: 'onboard',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
};

const phases: Record<Phase, { name: string; color: string; soft: string; icon: string }> = {
  menstrual: { name: 'Menstrual', color: '#ef6f91', soft: '#3d1e35', icon: '✦' },
  follicular: { name: 'Follicular', color: '#a78bfa', soft: '#29234c', icon: '❋' },
  ovulation: { name: 'Ovulation', color: '#e8c77a', soft: '#3c3426', icon: '✺' },
  luteal: { name: 'Luteal', color: '#7dd3c7', soft: '#193b3b', icon: '◒' }
};

function parseState(): AppState {
  try {
    const raw = localStorage.getItem(STORE) || localStorage.getItem('luna-cycle-state-v1');
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw);
    const lastPeriodDate = new Date(parsed.lastPeriodDate);
    return {
      ...emptyState, ...parsed, lastPeriodDate,
      periodStarts: parsed.periodStarts || [dateKey(lastPeriodDate)],
      settings: { ...defaultSettings, ...(parsed.settings || {}) }
    };
  } catch { return emptyState; }
}

function useRoute() {
  const [path, setPath] = useState(window.location.pathname === '/' ? (localStorage.getItem(STORE) ? '/dashboard' : '/onboarding') : window.location.pathname);
  useEffect(() => { const handler = () => setPath(window.location.pathname); window.addEventListener('popstate', handler); return () => window.removeEventListener('popstate', handler); }, []);
  const go = (next: string) => { window.history.pushState({}, '', next); setPath(next); window.scrollTo(0, 0); };
  return [path, go] as const;
}

function getCycleContext(state: AppState, date = today) {
  const starts = Array.from(new Set([dateKey(state.lastPeriodDate), ...state.periodStarts])).sort();
  const latest = starts.filter(start => start <= dateKey(date)).pop() || dateKey(state.lastPeriodDate);
  const lastStart = new Date(latest + 'T00:00:00');
  const avg = smartCycleLength(starts, state.cycleLength);
  const diff = daysBetween(lastStart, date);
  const cycleDay = Math.max(1, diff + 1);
  const ovulationDay = Math.max(state.periodLength + 2, avg - 14);
  const phase: Phase = cycleDay <= state.periodLength ? 'menstrual' : cycleDay < ovulationDay ? 'follicular' : cycleDay <= ovulationDay + 1 ? 'ovulation' : 'luteal';
  const nextPeriod = addDays(lastStart, avg);
  const ovulation = addDays(lastStart, ovulationDay - 1);
  const confidence = Math.min(94, 48 + Math.min(6, cycleLengthsFromStarts(starts).length) * 7 + Math.min(20, Object.keys(state.logs).length));
  return { starts, lastStart, avg, cycleDay, phase, nextPeriod, ovulation, fertileStart: addDays(ovulation, -5), fertileEnd: addDays(ovulation, 1), confidence };
}

const Card = ({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) => <section className={`glass-card ${className}`}>{children}</section>;
const Label = ({ children }: React.PropsWithChildren) => <p className="eyebrow">{children}</p>;
const Disclaimer = () => <div className="rounded-2xl border border-moon-300/20 bg-moon-300/5 p-4 text-xs leading-5 text-slate-400"><strong className="text-moon-300">A gentle note:</strong> This app is for personal tracking only and is not a substitute for medical advice. Lunar correlations are anecdotal and folkloric, not scientifically validated.</div>;

function Shell({ state, path, go, children }: React.PropsWithChildren<{ state: AppState; path: string; go: (p: string) => void }>) {
  const nav = [
    ['/dashboard', Home, 'Today'], ['/calendar', CalendarDays, 'Calendar'], ['/log', Plus, 'Log'],
    ['/insights', ChartNoAxesCombined, 'Insights'], ['/history', HeartPulse, 'History']
  ] as const;
  return <div className="min-h-screen bg-night-950 text-slate-100">
    <div className="stars" aria-hidden="true" />
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-night-950/85 p-6 backdrop-blur-xl lg:block">
      <button onClick={() => go('/dashboard')} className="mb-10 flex items-center gap-3">
        <span className="moon-logo"><Moon size={22}/></span><span className="font-display text-2xl">Luna Cycle</span>
      </button>
      <nav className="space-y-2">{nav.map(([href, Icon, label]) => <button key={href} onClick={() => go(href)} className={`side-link ${path === href ? 'side-link-active' : ''}`}><Icon size={18}/>{label}</button>)}</nav>
      <div className="absolute bottom-6 left-6 right-6 space-y-2">
        <button onClick={() => go('/settings')} className={`side-link ${path === '/settings' ? 'side-link-active' : ''}`}><SettingsIcon size={18}/>Settings</button>
        <button onClick={() => go('/privacy-policy')} className={`side-link ${path === '/privacy-policy' ? 'side-link-active' : ''}`}><ShieldCheck size={18}/>Privacy</button>
        <div className="mt-5 rounded-2xl border border-emerald-300/15 bg-emerald-300/5 p-3 text-xs text-emerald-200"><LockKeyhole size={14} className="mb-2"/>Your data stays on this device.</div>
      </div>
    </aside>
    <main className="relative mx-auto min-h-screen max-w-7xl px-4 pb-28 pt-6 sm:px-8 lg:ml-64 lg:px-10 lg:pb-10">{children}</main>
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-night-950/90 px-2 py-2 backdrop-blur-xl lg:hidden">
      {nav.map(([href, Icon, label]) => <button key={href} onClick={() => go(href)} className={`mobile-link ${path === href ? 'text-moon-300' : 'text-slate-500'} ${href === '/log' ? '-mt-6' : ''}`}><span className={href === '/log' ? 'grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-blush-400 to-violet-500 text-white shadow-glow' : ''}><Icon size={20}/></span><span>{label}</span></button>)}
    </nav>
  </div>;
}

function Onboarding({ state, setState, go }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; go: (p: string) => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: state.userName, lastPeriod: dateKey(state.lastPeriodDate), cycle: state.cycleLength, period: state.periodLength, birthDate: state.birthDate || '', timezone: state.timezone || '', location: state.location || '' });
  const finish = () => {
    const last = new Date(form.lastPeriod + 'T00:00:00');
    setState(s => ({ ...s, userName: form.name.trim() || 'Moon child', lastPeriodDate: last, cycleLength: form.cycle, periodLength: form.period, birthDate: form.birthDate, timezone: form.timezone, location: form.location, periodStarts: [form.lastPeriod] }));
    go('/dashboard');
  };
  return <div className="relative grid min-h-screen place-items-center overflow-hidden bg-night-950 px-4 py-10 text-slate-100">
    <div className="stars"/><div className="orb orb-one"/><div className="orb orb-two"/>
    <div className="relative z-10 w-full max-w-xl">
      <div className="mb-8 text-center"><span className="moon-logo mx-auto mb-4"><Moon size={25}/></span><p className="eyebrow">Private by design</p><h1 className="font-display text-5xl">Meet Luna Cycle</h1><p className="mt-3 text-slate-400">Your body has a rhythm. The sky does too.</p></div>
      <Card className="p-6 sm:p-8">
        <div className="mb-8 flex gap-2">{[0,1,2].map(i => <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-gradient-to-r from-blush-400 to-moon-300' : 'bg-white/10'}`}/>)}</div>
        {step === 0 && <div className="space-y-5"><div><Label>First, you</Label><h2 className="section-title">What should we call you?</h2></div><input className="field" value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Your name"/><p className="text-xs leading-5 text-slate-500">No account needed. This name and all health entries remain in your browser.</p></div>}
        {step === 1 && <div className="space-y-5"><div><Label>Your rhythm</Label><h2 className="section-title">Tell us about your cycle</h2></div><Field label="Last period start"><input className="field" type="date" max={dateKey(today)} value={form.lastPeriod} onChange={e => setForm({...form,lastPeriod:e.target.value})}/></Field><Range label="Average cycle" value={form.cycle} min={21} max={45} suffix="days" onChange={cycle => setForm({...form,cycle})}/><Range label="Period duration" value={form.period} min={2} max={10} suffix="days" onChange={period => setForm({...form,period})}/></div>}
        {step === 2 && <div className="space-y-5"><div><Label>Optional details</Label><h2 className="section-title">Make it more personal</h2></div><Field label="Birth date"><input className="field" type="date" value={form.birthDate} onChange={e => setForm({...form,birthDate:e.target.value})}/></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Timezone"><input className="field" value={form.timezone} onChange={e => setForm({...form,timezone:e.target.value})}/></Field><Field label="Location"><input className="field" placeholder="City, optional" value={form.location} onChange={e => setForm({...form,location:e.target.value})}/></Field></div><Disclaimer/></div>}
        <div className="mt-8 flex gap-3">{step > 0 && <button className="btn-secondary flex-1" onClick={() => setStep(step - 1)}>Back</button>}<button disabled={step === 0 && !form.name.trim()} className="btn-primary flex-[2] disabled:opacity-40" onClick={() => step < 2 ? setStep(step + 1) : finish()}>{step < 2 ? 'Continue' : 'Enter my orbit'} <Sparkles size={16}/></button></div>
      </Card>
    </div>
  </div>;
}

function Field({ label, children }: React.PropsWithChildren<{ label: string }>) { return <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</span>{children}</label>; }
function Range({ label, value, min, max, suffix, onChange }: { label:string; value:number; min:number; max:number; suffix:string; onChange:(n:number)=>void }) { return <Field label={label}><div className="flex items-center gap-4"><input className="w-full accent-blush-400" type="range" min={min} max={max} value={value} onChange={e=>onChange(+e.target.value)}/><span className="w-20 rounded-xl bg-white/5 px-3 py-2 text-center text-sm text-moon-300">{value} {suffix}</span></div></Field>; }

function Dashboard({ state, go }: { state: AppState; go:(p:string)=>void }) {
  const ctx = getCycleContext(state), moon = getMoonPhase(today), phase = phases[ctx.phase];
  const next = nextPredictions(ctx.lastStart, ctx.avg, 3);
  return <div className="space-y-6">
    <Header eyebrow={`${today.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}`} title={`Hello, ${state.userName}`} action={<button onClick={()=>go('/settings')} className="icon-btn"><SettingsIcon size={18}/></button>}/>
    <Card className="hero-card overflow-hidden p-6 sm:p-8">
      <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1fr_auto]">
        <div><Label>Current cycle</Label><div className="mt-2 flex flex-wrap items-end gap-3"><h2 className="font-display text-5xl sm:text-7xl">Day {ctx.cycleDay}</h2><span className="mb-2 text-slate-400">of {ctx.avg}</span></div><div className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm" style={{background:phase.soft,color:phase.color}}><span>{phase.icon}</span>{phase.name} phase</div></div>
        <div className="moon-disc"><span>{moon.icon}</span><small>{moon.illumination}% lit</small></div>
      </div>
      <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-3"><Metric label="Next period" value={`${Math.max(0,daysBetween(today,ctx.nextPeriod))} days`} sub={ctx.nextPeriod.toLocaleDateString(undefined,{month:'short',day:'numeric'})}/><Metric label="Ovulation" value={ctx.ovulation < today ? 'Next cycle' : `${Math.max(0,daysBetween(today,ctx.ovulation))} days`} sub={`${ctx.fertileStart.toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${ctx.fertileEnd.toLocaleDateString(undefined,{month:'short',day:'numeric'})}`}/><Metric label="Prediction" value={`${ctx.confidence}%`} sub={`${cycleLengthsFromStarts(ctx.starts).length} complete cycles`}/></div>
    </Card>
    <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
      <Card className="p-6"><div className="flex items-center justify-between"><div><Label>Tonight's sky</Label><h3 className="section-title">{moon.name}</h3></div><Moon className="text-moon-300" size={32}/></div><p className="mt-4 text-sm leading-6 text-slate-400">Your daily entry will be tagged with today’s lunar phase, helping you explore personal patterns over time—without claiming a medical connection.</p><button onClick={()=>go('/log')} className="btn-primary mt-6 w-full sm:w-auto"><Plus size={17}/>Quick log today</button></Card>
      <Card className="p-6"><Label>Coming up</Label><h3 className="section-title">Next three periods</h3><div className="mt-4 space-y-3">{next.map((date,i)=><div key={dateKey(date)} className="flex items-center justify-between rounded-xl bg-white/[.035] px-4 py-3"><span className="text-sm text-slate-400">{i===0?'Expected':'Following'}</span><strong>{date.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</strong></div>)}</div></Card>
    </div>
    <Disclaimer/>
  </div>;
}

function Header({ eyebrow, title, action }: { eyebrow:string; title:string; action?:React.ReactNode }) { return <header className="flex items-center justify-between"><div><Label>{eyebrow}</Label><h1 className="font-display text-3xl sm:text-4xl">{title}</h1></div>{action}</header>; }
function Metric({label,value,sub}:{label:string;value:string;sub:string}) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>; }

function CalendarPage({ state, go }: {state:AppState;go:(p:string)=>void}) {
  const [month,setMonth]=useState(new Date(today.getFullYear(),today.getMonth(),1)); const [layer,setLayer]=useState<'cycle'|'moon'>('cycle');
  const days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate(), offset=month.getDay();
  return <div className="space-y-6"><Header eyebrow="Your rhythm at a glance" title="Calendar"/><Card className="p-4 sm:p-7">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><button className="icon-btn" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft size={18}/></button><h2 className="min-w-40 text-center font-display text-2xl">{month.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h2><button className="icon-btn" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight size={18}/></button></div><div className="toggle"><button className={layer==='cycle'?'active':''} onClick={()=>setLayer('cycle')}>Cycle</button><button className={layer==='moon'?'active':''} onClick={()=>setLayer('moon')}>Moon</button></div></div>
    <div className="calendar-grid">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} className="calendar-label">{d.slice(0,2)}</div>)}{Array.from({length:offset},(_,i)=><div key={`blank${i}`}/>)}{Array.from({length:days},(_,i)=>{const d=new Date(month.getFullYear(),month.getMonth(),i+1), key=dateKey(d), ctx=getCycleContext(state,d), moon=getMoonPhase(d), log=state.logs[key]; const period=ctx.cycleDay<=state.periodLength || (log?.flow && log.flow!=='none'); const fertile=daysBetween(ctx.fertileStart,d)>=0&&daysBetween(d,ctx.fertileEnd)>=0; const ovulation=dateKey(ctx.ovulation)===key; return <button key={key} onClick={()=>go(`/log?date=${key}`)} className={`calendar-day ${dateKey(today)===key?'today':''} ${layer==='cycle'&&period?'period':''} ${layer==='cycle'&&fertile&&!period?'fertile':''} ${layer==='cycle'&&ovulation?'ovulation':''}`}><span>{i+1}</span><small title={moon.name}>{moon.icon}</small>{log&&<i/>}</button>})}</div>
    <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400"><Legend color="bg-blush-400" label="Period"/><Legend color="bg-violet-400" label="Fertile"/><Legend color="bg-moon-300" label="Ovulation"/><span>Moon symbol = daily lunar phase</span></div>
  </Card></div>;
}
function Legend({color,label}:{color:string;label:string}) {return <span className="flex items-center gap-2"><i className={`h-2.5 w-2.5 rounded-full ${color}`}/>{label}</span>;}

function LogPage({state,setState,go}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>;go:(p:string)=>void}) {
  const query=new URLSearchParams(window.location.search), selected=query.get('date')||dateKey(today), existing=state.logs[selected];
  const [log,setLog]=useState<DailyLog>(existing||{date:selected,mood:null,symptoms:[],flow:null,energy:5,sleep:7,cramps:0,notes:'',moonPhase:getMoonPhase(new Date(selected+'T00:00:00')).name});
  const symptoms=['Bloating','Headache','Acne','Cravings','Tender breasts','Back pain','Nausea','Spotting']; const moods=['Calm','Radiant','Tender','Anxious','Irritable','Low'];
  const save=()=>{setState(s=>{const starts=log.periodStart?Array.from(new Set([...s.periodStarts,selected])).sort():s.periodStarts; return {...s,logs:{...s.logs,[selected]:log},periodStarts:starts,lastPeriodDate:log.periodStart?new Date(selected+'T00:00:00'):s.lastPeriodDate}});go('/dashboard');};
  return <div className="space-y-6"><Header eyebrow={new Date(selected+'T00:00:00').toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})} title="Daily log"/><div className="grid gap-6 xl:grid-cols-2">
    <Card className="space-y-7 p-6"><div><Label>Period</Label><div className="mt-3 flex flex-wrap gap-2">{(['none','light','medium','heavy'] as FlowLevel[]).map(flow=><button key={flow} onClick={()=>setLog({...log,flow})} className={`choice ${log.flow===flow?'choice-active':''}`}><Droplets size={14}/>{flow}</button>)}</div><label className="mt-4 flex items-center gap-3 text-sm text-slate-300"><input type="checkbox" checked={!!log.periodStart} onChange={e=>setLog({...log,periodStart:e.target.checked})} className="accent-blush-400"/>This is the first day of my period</label></div>
    <div><Label>Mood</Label><div className="mt-3 flex flex-wrap gap-2">{moods.map(m=><button key={m} onClick={()=>setLog({...log,mood:m})} className={`choice ${log.mood===m?'choice-active':''}`}>{m}</button>)}</div></div>
    <Range label="Energy" value={log.energy} min={1} max={10} suffix="/10" onChange={energy=>setLog({...log,energy})}/><Range label="Sleep quality" value={log.sleep} min={1} max={10} suffix="/10" onChange={sleep=>setLog({...log,sleep})}/><Range label="Cramps" value={log.cramps||0} min={0} max={10} suffix="/10" onChange={cramps=>setLog({...log,cramps})}/>
    </Card>
    <Card className="space-y-7 p-6"><div><Label>Symptoms</Label><div className="mt-3 flex flex-wrap gap-2">{symptoms.map(sym=><button key={sym} onClick={()=>setLog({...log,symptoms:log.symptoms.includes(sym)?log.symptoms.filter(s=>s!==sym):[...log.symptoms,sym]})} className={`choice ${log.symptoms.includes(sym)?'choice-active':''}`}>{sym}</button>)}</div></div><Field label="Private notes"><textarea rows={5} className="field resize-none" value={log.notes} onChange={e=>setLog({...log,notes:e.target.value})} placeholder="What feels different today?"/></Field><div className="rounded-2xl bg-moon-300/5 p-4 text-sm text-slate-400"><Moon size={18} className="mb-2 text-moon-300"/>Automatically tagged: <strong className="text-slate-200">{log.moonPhase}</strong></div><button onClick={save} className="btn-primary w-full">Save private entry <Sparkles size={16}/></button></Card>
  </div></div>;
}

function InsightsPage({state}:{state:AppState}) {
  const ctx=getCycleContext(state); const moonCounts=ctx.starts.reduce((a,s)=>{const name=getMoonPhase(new Date(s+'T00:00:00')).name;a[name]=(a[name]||0)+1;return a;},{} as Record<string,number>);
  const moonData=Object.entries(moonCounts).map(([name,count])=>({name:name.replace(' Moon',''),count,percent:Math.round(count/ctx.starts.length*100)}));
  const symptomCounts=Object.values(state.logs).flatMap(l=>l.symptoms).reduce((a,s)=>({...a,[s]:(a[s]||0)+1}),{} as Record<string,number>);
  return <div className="space-y-6"><Header eyebrow="Patterns, not prescriptions" title="Lunar insights"/><div className="grid gap-6 lg:grid-cols-3"><MetricCard label="Cycles tracked" value={String(ctx.starts.length)} sub="More history improves predictions"/><MetricCard label="Most common moon" value={moonData.sort((a,b)=>b.count-a.count)[0]?.name||'Not enough data'} sub="At period start"/><MetricCard label="Prediction confidence" value={`${ctx.confidence}%`} sub="Based on cycle history"/></div>
    <div className="grid gap-6 xl:grid-cols-2"><Card className="p-6"><Label>Period starts by moon phase</Label><h2 className="section-title">Your lunar distribution</h2><div className="mt-6 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={moonData}><CartesianGrid stroke="#ffffff10" vertical={false}/><XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:11}}/><YAxis allowDecimals={false} tick={{fill:'#94a3b8',fontSize:11}}/><Tooltip contentStyle={{background:'#171d3b',border:'1px solid #ffffff18',borderRadius:14}}/><Bar dataKey="count" fill="#d9ba6f" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div></Card><Card className="p-6"><Label>Body signals</Label><h2 className="section-title">Most logged symptoms</h2><div className="mt-6 space-y-4">{Object.entries(symptomCounts).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,count])=><div key={name}><div className="mb-1 flex justify-between text-sm"><span>{name}</span><span className="text-slate-500">{count} logs</span></div><div className="h-2 rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-blush-400 to-violet-400" style={{width:`${Math.min(100,count/Math.max(1,Object.keys(state.logs).length)*100)}%`}}/></div></div>)}{!Object.keys(symptomCounts).length&&<Empty text="Log symptoms for a few days to reveal patterns."/ >}</div></Card></div><Disclaimer/>
  </div>;
}
function MetricCard({label,value,sub}:{label:string;value:string;sub:string}){return <Card className="p-5"><Label>{label}</Label><strong className="mt-2 block font-display text-3xl text-moon-300">{value}</strong><p className="mt-1 text-xs text-slate-500">{sub}</p></Card>}
function Empty({text}:{text:string}){return <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-white/10 text-center text-sm text-slate-500">{text}</div>}

function HistoryPage({state}:{state:AppState}) {
  const ctx=getCycleContext(state), lengths=cycleLengthsFromStarts(ctx.starts), chart=lengths.map((length,i)=>({cycle:`Cycle ${i+1}`,length}));
  const downloadCsv=()=>{const rows=['date,flow,mood,energy,sleep,cramps,symptoms,moon_phase,notes',...Object.values(state.logs).map(l=>[l.date,l.flow||'',l.mood||'',l.energy,l.sleep,l.cramps||0,`"${l.symptoms.join(';')}"`,l.moonPhase||'',`"${l.notes.replace(/"/g,'""')}"`].join(','))];const url=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='luna-cycle-export.csv';a.click();URL.revokeObjectURL(url);};
  return <div className="space-y-6"><Header eyebrow="Your private archive" title="Cycle history" action={<div className="flex gap-2"><button className="btn-secondary" onClick={downloadCsv}><Download size={16}/>CSV</button><button className="btn-secondary" onClick={()=>window.print()}><Download size={16}/>PDF</button></div>}/><div className="grid gap-4 sm:grid-cols-3"><MetricCard label="Average" value={`${ctx.avg} days`} sub="Recent cycle average"/><MetricCard label="Shortest" value={lengths.length?`${Math.min(...lengths)} days`:'—'} sub="Completed cycles"/><MetricCard label="Longest" value={lengths.length?`${Math.max(...lengths)} days`:'—'} sub="Completed cycles"/></div><Card className="p-6"><Label>Cycle length trend</Label><div className="mt-5 h-64">{chart.length?<ResponsiveContainer width="100%" height="100%"><AreaChart data={chart}><defs><linearGradient id="cycleFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e783a3" stopOpacity=".5"/><stop offset="1" stopColor="#e783a3" stopOpacity="0"/></linearGradient></defs><CartesianGrid stroke="#ffffff10"/><XAxis dataKey="cycle" tick={{fill:'#94a3b8',fontSize:11}}/><YAxis domain={['dataMin - 3','dataMax + 3']} tick={{fill:'#94a3b8',fontSize:11}}/><Tooltip contentStyle={{background:'#171d3b',border:'1px solid #ffffff18',borderRadius:14}}/><Area type="monotone" dataKey="length" stroke="#e783a3" fill="url(#cycleFill)" strokeWidth={3}/></AreaChart></ResponsiveContainer>:<Empty text="Log at least two period starts to see cycle history."/ >}</div></Card><Card className="p-6"><Label>Past period starts</Label><div className="mt-4 divide-y divide-white/5">{ctx.starts.slice().reverse().map((start,i)=><div key={start} className="flex items-center justify-between py-4"><div><strong>{new Date(start+'T00:00:00').toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'})}</strong><p className="mt-1 text-xs text-slate-500">{getMoonPhase(new Date(start+'T00:00:00')).name}</p></div><span className="text-sm text-slate-400">{i<ctx.starts.length-1?`${daysBetween(new Date(ctx.starts[ctx.starts.length-2-i]+'T00:00:00'),new Date(start+'T00:00:00'))} days`:'First entry'}</span></div>)}</div></Card></div>;
}

function SettingsPage({state,setState,go}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>;go:(p:string)=>void}) {
  const update=(patch:Partial<Settings>)=>setState(s=>({...s,settings:{...s.settings,...patch}}));
  const clear=()=>{if(window.confirm('Permanently delete all Luna Cycle data from this device? This cannot be undone.')){localStorage.removeItem(STORE);localStorage.removeItem('luna-cycle-state-v1');setState(emptyState);go('/onboarding');}};
  return <div className="space-y-6"><Header eyebrow="Make Luna yours" title="Settings"/><div className="grid gap-6 xl:grid-cols-2"><Card className="p-6"><Label>Reminders</Label><h2 className="section-title">Gentle nudges</h2><div className="mt-5 space-y-2"><SettingToggle label="Upcoming period" checked={state.settings.periodReminder} onChange={periodReminder=>update({periodReminder})}/><SettingToggle label="Ovulation window" checked={state.settings.ovulationReminder} onChange={ovulationReminder=>update({ovulationReminder})}/><SettingToggle label="Daily log reminder" checked={state.settings.logReminder} onChange={logReminder=>update({logReminder})}/></div></Card><Card className="p-6"><Label>Appearance</Label><h2 className="section-title">Moonlit preferences</h2><div className="mt-5 space-y-2"><SettingToggle label="Dark moon theme" checked={state.settings.darkMode} onChange={darkMode=>update({darkMode})}/><div className="setting-row"><span>Units</span><select className="field max-w-36 py-2" value={state.settings.units} onChange={e=>update({units:e.target.value as Settings['units']})}><option value="metric">Metric</option><option value="imperial">Imperial</option></select></div></div></Card><Card className="p-6 xl:col-span-2"><Label>Privacy controls</Label><h2 className="section-title">You own every entry</h2><div className="mt-5 rounded-2xl border border-emerald-300/15 bg-emerald-300/5 p-5"><div className="flex gap-4"><LockKeyhole className="shrink-0 text-emerald-300"/><div><strong>Local storage only</strong><p className="mt-1 text-sm leading-6 text-slate-400">No account, analytics, advertising pixels, or health-data server. Cloud sync is intentionally unavailable until end-to-end encryption can be guaranteed.</p></div></div></div><div className="mt-5 flex flex-wrap gap-3"><button onClick={()=>go('/privacy-policy')} className="btn-secondary"><ShieldCheck size={16}/>Read privacy policy</button><button onClick={clear} className="btn-danger"><Trash2 size={16}/>Delete all data</button></div></Card></div></div>;
}
function SettingToggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}){return <label className="setting-row"><span>{label}</span><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} className="switch"/></label>}

function PrivacyPage(){return <article className="mx-auto max-w-3xl space-y-6"><Header eyebrow="Plain language, no fine-print tricks" title="Privacy policy"/><Card className="prose-card p-6 sm:p-10"><p className="lead">Luna Cycle is designed so your intimate health data stays yours.</p><h2>What we store</h2><p>Your onboarding details, daily logs, preferences, and cycle history are stored in your browser’s local storage on this device.</p><h2>What leaves your device</h2><p>Nothing. This version has no account system, cloud database, advertising tracker, or health-data analytics. If you export CSV or print to PDF, you decide where that file goes.</p><h2>Location and timezone</h2><p>Timezone and location are optional. Lunar phase calculations run locally using the date; your location is not transmitted to a moon service.</p><h2>Deletion</h2><p>Use Settings → Delete all data to permanently remove Luna Cycle data from this browser. Clearing browser storage also removes it.</p><h2>Medical disclaimer</h2><p>This app is for personal tracking only and is not a substitute for medical advice, diagnosis, contraception, or emergency care. Fertile-window and period dates are estimates. Lunar correlations are anecdotal and folkloric, not scientifically validated.</p><p className="text-xs text-slate-500">Effective July 27, 2026.</p></Card></article>}

export default function App() {
  const [state,setState]=useState<AppState>(parseState); const [path,go]=useRoute();
  useEffect(()=>{document.documentElement.classList.toggle('dark',state.settings.darkMode);if(state.userName)localStorage.setItem(STORE,JSON.stringify(state));},[state]);
  if(path==='/onboarding'||!state.userName)return <Onboarding state={state} setState={setState} go={go}/>;
  const route=path.split('?')[0];
  let page:React.ReactNode;
  if(route==='/calendar')page=<CalendarPage state={state} go={go}/>;
  else if(route==='/log')page=<LogPage state={state} setState={setState} go={go}/>;
  else if(route==='/insights')page=<InsightsPage state={state}/>;
  else if(route==='/history')page=<HistoryPage state={state}/>;
  else if(route==='/settings')page=<SettingsPage state={state} setState={setState} go={go}/>;
  else if(route==='/privacy-policy')page=<PrivacyPage/>;
  else page=<Dashboard state={state} go={go}/>;
  return <Shell state={state} path={route} go={go}>{page}</Shell>;
}
