import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AppState, Screen, ChatMessage } from '../types';
import { getPrediction, generateAIResponse } from '../engine';

interface Props { state: AppState; onNavigate: (s: Screen) => void; }

const QUICK = ['When is my next period?','What should I eat now?','Workout suggestions?','Why am I so tired?','Cramps relief tips?','My fertile window?'];

const INIT: ChatMessage = {
  id:'init', role:'bot', time: new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}),
  text:`Hi ${'' }! I'm Luna 🌙\n\nI'm your personal menstrual health AI. Ask me anything about your cycle, nutrition, symptoms, mood, or fitness — I'll give you personalized answers based on where you are in your cycle.\n\nWhat's on your mind today?`,
};

export default function AIChat({ state, onNavigate }: Props) {
  const pred = useMemo(() => getPrediction(state.lastPeriodDate, state.cycleLength, state.periodLength), [state]);
  const initMsg = useMemo(() => ({ ...INIT, text: `Hi ${state.userName || 'there'}! I'm Luna 🌙\n\nI'm your personal menstrual health AI. You're on day ${pred.cycleDay} of your cycle — ${pred.phaseName} phase.\n\nAsk me anything about your cycle, nutrition, symptoms, mood, or fitness. I'll give you personalized advice based on where you are right now.`, time: new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) }), [state.userName, pred]);

  const [messages, setMessages] = useState<ChatMessage[]>([initMsg]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, typing]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
    const userMsg: ChatMessage = { id: Date.now()+'u', role:'user', text: text.trim(), time:now };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const reply = generateAIResponse(text, pred);
      setTyping(false);
      setMessages(m => [...m, { id: Date.now()+'b', role:'bot', text: reply, time: new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) }]);
    }, 800 + Math.random() * 600);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #F5F5F4', display:'flex', alignItems:'center', gap:'12px', flexShrink:0, background:'linear-gradient(135deg, #EDE9FE, white)' }}>
        <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'linear-gradient(135deg,#A78BFA,#E8638C)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', boxShadow:'var(--shadow-purple)' }}>🌙</div>
        <div>
          <p style={{ fontWeight:700, fontSize:'15px', color:'#1C1917' }}>Luna AI</p>
          <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
            <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#2DD4BF', animation:'pulse 2s infinite' }} />
            <p style={{ fontSize:'12px', color:'#2DD4BF', fontWeight:500 }}>Always here for you</p>
          </div>
        </div>
        <div style={{ marginLeft:'auto', background:'#FDF2F6', border:'1px solid #FAD9E8', borderRadius:'12px', padding:'5px 10px', display:'flex', alignItems:'center', gap:'4px' }}>
          <span style={{ fontSize:'12px' }}>{pred.phaseEmoji}</span>
          <span style={{ fontSize:'11px', color:'#9B2252', fontWeight:600 }}>Day {pred.cycleDay}</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'14px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display:'flex', flexDirection:'column', alignItems: msg.role==='user' ? 'flex-end' : 'flex-start', gap:'4px' }}>
            <div style={{ maxWidth:'85%', padding:'11px 14px', borderRadius: msg.role==='user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: msg.role==='user' ? 'linear-gradient(135deg,#E8638C,#A78BFA)' : '#F5F5F4', color: msg.role==='user' ? 'white' : '#1C1917', fontSize:'14px', lineHeight:1.6, whiteSpace:'pre-line', boxShadow: msg.role==='user' ? 'var(--shadow-pink)' : 'var(--shadow-sm)' }}>
              {msg.text}
            </div>
            <span style={{ fontSize:'10px', color:'var(--gray-300)', paddingLeft: msg.role==='bot' ? '4px' : 0, paddingRight: msg.role==='user' ? '4px' : 0 }}>{msg.time}</span>
          </div>
        ))}

        {typing && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'4px' }}>
            <div style={{ padding:'12px 16px', background:'#F5F5F4', borderRadius:'18px 18px 18px 4px', display:'flex', gap:'5px', alignItems:'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#A78BFA', animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick replies */}
      <div style={{ padding:'8px 12px', borderTop:'1px solid #F5F5F4', display:'flex', gap:'6px', overflowX:'auto', scrollbarWidth:'none', flexShrink:0 }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => send(q)}
            style={{ flexShrink:0, padding:'6px 12px', borderRadius:'16px', border:'1.5px solid #FAD9E8', background:'#FDF2F6', color:'#9B2252', fontSize:'12px', fontWeight:500, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s' }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding:'10px 14px 14px', display:'flex', gap:'8px', alignItems:'flex-end', flexShrink:0 }}>
        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Ask Luna anything…" rows={1}
          style={{ flex:1, padding:'11px 14px', border:'2px solid #FAD9E8', borderRadius:'18px', resize:'none', fontSize:'14px', fontFamily:'var(--font-body)', outline:'none', lineHeight:1.5, maxHeight:'80px', overflowY:'auto', transition:'border 0.15s', color:'#1C1917' }}
          onFocus={e => e.target.style.borderColor='#E8638C'} onBlur={e => e.target.style.borderColor='#FAD9E8'} />
        <button onClick={() => send(input)} disabled={!input.trim() || typing}
          style={{ width:'42px', height:'42px', borderRadius:'50%', background: input.trim() && !typing ? 'linear-gradient(135deg,#E8638C,#A78BFA)' : '#F5F5F4', border:'none', cursor: input.trim() && !typing ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0, boxShadow: input.trim() && !typing ? 'var(--shadow-pink)' : 'none', transition:'all 0.2s' }}>
          ↑
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-6px);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
