import { Phase, CyclePrediction, DailyLog } from './types';

export function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
export function dateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function getPrediction(lastPeriod: Date, cycleLen: number, periodLen: number): CyclePrediction {
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = daysBetween(lastPeriod, today);
  const cycleDay = (diff % cycleLen) + 1;

  let phase: Phase;
  let phaseName: string;
  let phaseEmoji: string;

  if (cycleDay <= periodLen) {
    phase = 'menstrual'; phaseName = 'Menstrual'; phaseEmoji = '🌑';
  } else if (cycleDay <= cycleLen - 14) {
    phase = 'follicular'; phaseName = 'Follicular'; phaseEmoji = '🌸';
  } else if (cycleDay <= cycleLen - 12) {
    phase = 'ovulation'; phaseName = 'Ovulation'; phaseEmoji = '✨';
  } else {
    phase = 'luteal'; phaseName = 'Luteal'; phaseEmoji = '🌕';
  }

  const nextPeriodDate = addDays(lastPeriod, cycleLen * (Math.floor(diff / cycleLen) + 1));
  const ovulationDate = addDays(lastPeriod, cycleLen * Math.floor(diff / cycleLen) + 14);
  const fertileStart = addDays(ovulationDate, -5);
  const fertileEnd = addDays(ovulationDate, 1);
  const daysToNextPeriod = Math.max(0, daysBetween(today, nextPeriodDate));

  return { cycleDay, cycleLength: cycleLen, phase, phaseName, phaseEmoji, daysToNextPeriod, nextPeriodDate, ovulationDate, fertileStart, fertileEnd, confidence: 0.92 };
}

export function getDayClass(date: Date, lastPeriod: Date, cycleLen: number, periodLen: number, logs: Record<string, DailyLog>): string[] {
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = daysBetween(lastPeriod, date);
  const pos = ((diff % cycleLen) + cycleLen) % cycleLen;
  const classes: string[] = [];

  if (dateKey(date) === dateKey(today)) classes.push('today');
  if (diff >= 0 && diff < cycleLen * 4) {
    if (pos < periodLen) classes.push('period');
    else if (pos === 14) classes.push('ovulation');
    else if (pos >= 11 && pos <= 16) classes.push('fertile');
    else if (diff >= cycleLen && pos < periodLen + cycleLen) classes.push('predicted');
  }
  if (logs[dateKey(date)]) classes.push('logged');
  return classes;
}

export const PHASE_DATA = {
  menstrual:  { color: '#E8638C', bg: '#FDF2F6', text: '#9B2252', label: 'Menstrual', days: '1–5', hormone: 'Estrogen & progesterone at their lowest', workout: 'Gentle yoga, walking, rest', diet: 'Iron-rich foods: spinach, lentils, dark chocolate', mood: 'Reflective, introspective. Be gentle with yourself.', tip: 'Your body is working hard. Rest is productive.' },
  follicular: { color: '#A78BFA', bg: '#EDE9FE', text: '#7C3AED', label: 'Follicular', days: '6–13', hormone: 'Estrogen rising steadily', workout: 'HIIT, strength training, cardio', diet: 'Lean protein, fermented foods, leafy greens', mood: 'Rising energy and motivation. Great social energy!', tip: 'Start that new project. Your creativity is peaking.' },
  ovulation:  { color: '#2DD4BF', bg: '#CCFBF1', text: '#0D9488', label: 'Ovulation', days: '14–16', hormone: 'LH surge, estrogen peak', workout: 'Peak performance — push your limits!', diet: 'Antioxidants, zinc (pumpkin seeds, berries)', mood: 'Most confident and communicative. You shine!', tip: 'Schedule important meetings and presentations today.' },
  luteal:     { color: '#FBBF24', bg: '#FEF3C7', text: '#D97706', label: 'Luteal', days: '17–28', hormone: 'Progesterone dominant', workout: 'Pilates, swimming, moderate cardio', diet: 'Magnesium (nuts, seeds) reduces PMS symptoms', mood: 'PMS may appear. Prioritise self-care and rest.', tip: 'Reduce caffeine and salt to ease bloating.' },
};

export function generateAIResponse(msg: string, pred: CyclePrediction): string {
  const m = msg.toLowerCase();
  const { phaseName, cycleDay, daysToNextPeriod, nextPeriodDate, fertileStart, fertileEnd, ovulationDate } = pred;
  const pd = PHASE_DATA[pred.phase];

  if (m.match(/tired|fatigue|energy|exhausted/)) return `On day ${cycleDay} in your ${phaseName} phase, ${pred.phase === 'luteal' ? 'progesterone can cause fatigue — totally normal.' : 'an energy dip can happen due to hormonal shifts.'} Try: ${pd.workout}. Also, ${pd.diet.toLowerCase()}.`;
  if (m.match(/cramp|pain|ache/)) return `Cramps are caused by prostaglandins contracting the uterus. Relief tips: heat therapy on your lower abdomen, ibuprofen (anti-inflammatory), magnesium-rich foods like dark chocolate and nuts, and gentle yoga poses like Child's Pose.`;
  if (m.match(/food|eat|diet|nutrition/)) return `In your ${phaseName} phase: ${pd.diet}. Your hormones directly influence what your body needs — eat with your cycle! ${pd.tip}`;
  if (m.match(/workout|exercise|gym|fitness/)) return `${phaseName} phase workout: ${pd.workout}. ${pred.phase === 'follicular' || pred.phase === 'ovulation' ? 'Estrogen is high — great time to push performance!' : 'Your body may need more recovery time — listen to it.'}`;
  if (m.match(/fertile|ovulation|conceive|pregnant/)) return `Your fertile window is ${fertileStart.toLocaleDateString('en-IN',{month:'short',day:'numeric'})}–${fertileEnd.toLocaleDateString('en-IN',{month:'short',day:'numeric'})} with ovulation expected ${ovulationDate.toLocaleDateString('en-IN',{month:'long',day:'numeric'})}. Sperm can survive 3–5 days, so the days just before ovulation are key.`;
  if (m.match(/period|next|when|due/)) return `Your next period is predicted ${nextPeriodDate.toLocaleDateString('en-IN',{month:'long',day:'numeric'})} — that's ${daysToNextPeriod} days away. I'll get more accurate as you log more cycles!`;
  if (m.match(/mood|pms|emotional|irritab/)) return `PMS symptoms typically peak in the luteal phase (days 17–28). You're on day ${cycleDay}. Evidence-based relief: regular exercise, magnesium supplements, reduced caffeine, and stress management. If symptoms are severe, it's worth speaking to a doctor about PMDD.`;
  if (m.match(/sleep/)) return `Sleep quality shifts with your cycle. During ${phaseName}: progesterone${pred.phase === 'luteal' ? ' can cause early drowsiness but also night waking' : ' levels are lower, which often means lighter sleep'}. Try magnesium glycinate before bed, keep a consistent schedule, and avoid screens 1 hour before sleep.`;
  if (m.match(/hi|hello|hey/)) return `Hi! I'm Luna 🌙 You're on day ${cycleDay} of your cycle — ${phaseName} phase. ${daysToNextPeriod} days until your next period. What can I help you with today?`;
  return `You're currently in your ${phaseName} phase (day ${cycleDay}). Your hormones are ${pd.hormone.toLowerCase()}. ${pd.tip} Ask me about nutrition, workouts, symptoms, your fertile window, or how to manage PMS!`;
}
