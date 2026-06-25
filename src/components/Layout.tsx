import React from 'react';
import { Screen } from '../types';

interface Props { currentScreen: Exclude<Screen,'onboard'>; onNavigate: (s: Screen) => void; children: React.ReactNode; }

const NAV = [
  { id:'home', icon:'⊞', label:'Home' },
  { id:'calendar', icon:'◫', label:'Calendar' },
  { id:'log', icon:'✦', label:'Log', center:true },
  { id:'insights', icon:'◈', label:'Insights' },
  { id:'ai', icon:'◉', label:'Luna AI' },
] as const;

export default function Layout({ currentScreen, onNavigate, children }: Props) {
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', maxWidth:'480px', margin:'0 auto', background:'white', position:'relative', boxShadow:'0 0 0 1px rgba(0,0,0,0.06)' }}>
      <main style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
        {children}
      </main>
      <nav style={{ display:'flex', borderTop:'1px solid #F5F5F4', background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', flexShrink:0, padding:'4px 0 8px', zIndex:50 }}>
        {NAV.map(item => {
          const active = currentScreen === item.id;
          const isCenter = 'center' in item && item.center;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id as Screen)}
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', background:'none', border:'none', padding: isCenter ? '0' : '6px 0', cursor:'pointer', position:'relative' }}>
              {isCenter ? (
                <div style={{ width:'46px', height:'46px', borderRadius:'50%', background:'linear-gradient(135deg,#E8638C,#A78BFA)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(232,99,140,0.4)', marginTop:'-16px', fontSize:'20px', color:'white' }}>
                  {item.icon}
                </div>
              ) : (
                <span style={{ fontSize:'18px', lineHeight:1, filter: active ? 'none' : 'grayscale(0.4) opacity(0.6)' }}>{item.icon}</span>
              )}
              <span style={{ fontSize:'10px', fontWeight: active ? 600 : 400, color: active ? '#E8638C' : '#A8A29E', lineHeight:1 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
