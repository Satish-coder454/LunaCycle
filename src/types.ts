export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
export type TrackingMode = 'period' | 'conceive' | 'pregnancy';
export type FlowLevel = 'none' | 'light' | 'medium' | 'heavy';
export type Screen = 'home' | 'calendar' | 'log' | 'insights' | 'history' | 'settings' | 'privacy' | 'ai' | 'onboard';

export interface DailyLog {
  date: string;
  mood: string | null;
  symptoms: string[];
  flow: FlowLevel | null;
  energy: number;
  sleep: number;
  cramps?: number;
  notes: string;
  periodStart?: boolean;
  periodEnd?: boolean;
  moonPhase?: string;
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

export interface Settings {
  darkMode: boolean;
  periodReminder: boolean;
  ovulationReminder: boolean;
  logReminder: boolean;
  units: 'metric' | 'imperial';
  storage: 'local' | 'sync';
}

export interface AppState {
  userName: string;
  mode: TrackingMode;
  lastPeriodDate: Date;
  cycleLength: number;
  periodLength: number;
  birthDate?: string;
  timezone?: string;
  location?: string;
  logs: Record<string, DailyLog>;
  periodStarts: string[];
  settings: Settings;
  currentScreen: Screen;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  time: string;
}
