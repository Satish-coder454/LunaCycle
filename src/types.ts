export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
export type TrackingMode = 'period' | 'conceive' | 'pregnancy';
export type FlowLevel = 'none' | 'light' | 'medium' | 'heavy';
export type Screen = 'home' | 'calendar' | 'log' | 'insights' | 'ai' | 'onboard';

export interface DailyLog {
  date: string;
  mood: string | null;
  symptoms: string[];
  flow: FlowLevel | null;
  energy: number;
  sleep: number;
  notes: string;
}

export interface CyclePrediction {
  cycleDay: number;
  cycleLength: number;
  phase: Phase;
  phaseName: string;
  phaseEmoji: string;
  daysToNextPeriod: number;
  nextPeriodDate: Date;
  ovulationDate: Date;
  fertileStart: Date;
  fertileEnd: Date;
  confidence: number;
}

export interface AppState {
  userName: string;
  mode: TrackingMode;
  lastPeriodDate: Date;
  cycleLength: number;
  periodLength: number;
  logs: Record<string, DailyLog>;
  currentScreen: Screen;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  time: string;
}
