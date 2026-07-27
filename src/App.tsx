import React, { useState, useCallback, useEffect } from 'react';
import { AppState, Screen, DailyLog } from './types';
import { addDays } from './engine';
import Onboarding from './components/Onboarding';
import Layout from './components/Layout';
import Home from './components/Home';
import Calendar from './components/CalendarView';
import LogDay from './components/LogDay';
import Insights from './components/Insights';
import AIChat from './components/AIChat';
import './index.css';

const today = new Date(); today.setHours(0,0,0,0);

const defaultState: AppState = {
  userName: '',
  mode: 'period',
  lastPeriodDate: addDays(today, -14),
  cycleLength: 28,
  periodLength: 5,
  logs: {},
  currentScreen: 'onboard',
};

const STORAGE_KEY = 'luna-cycle-state-v1';

function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultState;
    const parsed = JSON.parse(saved);
    const lastPeriodDate = new Date(parsed.lastPeriodDate);
    if (!parsed.userName || Number.isNaN(lastPeriodDate.getTime())) return defaultState;
    return { ...defaultState, ...parsed, lastPeriodDate, currentScreen: 'home' };
  } catch {
    return defaultState;
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    if (state.userName) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, currentScreen: 'home' }));
    }
  }, [state]);

  const navigate = useCallback((screen: Screen) => {
    setState(s => ({ ...s, currentScreen: screen }));
  }, []);

  const saveLog = useCallback((log: DailyLog) => {
    setState(s => ({ ...s, logs: { ...s.logs, [log.date]: log }, currentScreen: 'home' }));
  }, []);

  const finishOnboard = useCallback((name: string, mode: AppState['mode'], lastPeriod: Date, cycleLen: number, periodLen: number) => {
    setState(s => ({ ...s, userName: name, mode, lastPeriodDate: lastPeriod, cycleLength: cycleLen, periodLength: periodLen, currentScreen: 'home' }));
  }, []);

  if (state.currentScreen === 'onboard') {
    return <Onboarding onFinish={finishOnboard} />;
  }

  const screenMap: Record<Exclude<Screen, 'onboard'>, React.ReactNode> = {
    home: <Home state={state} onNavigate={navigate} />,
    calendar: <Calendar state={state} onNavigate={navigate} />,
    log: <LogDay state={state} onSave={saveLog} onNavigate={navigate} />,
    insights: <Insights state={state} onNavigate={navigate} />,
    ai: <AIChat state={state} onNavigate={navigate} />,
  };

  return (
    <Layout currentScreen={state.currentScreen as Exclude<Screen,'onboard'>} onNavigate={navigate}>
      {screenMap[state.currentScreen as Exclude<Screen,'onboard'>]}
    </Layout>
  );
}
