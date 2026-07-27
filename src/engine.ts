import { Phase, CyclePrediction, DailyLog } from './types';

export function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
export function daysBetween(a: Date, b: Date): number {
  const au = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bu = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bu - au) / 86400000);
}
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getPrediction(lastPeriod: Date, cycleLen: number, periodLen: number, logs: Record<string, DailyLog> = {}): CyclePrediction {
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = daysBetween(lastPeriod, today);
  const normalized = ((diff % cycleLen) + cycleLen) % cycleLen;
  const cycleDay = normalized + 1;
  const cycleStart = addDays(lastPeriod, diff - normalized);
  const ovulationDay = Math.max(periodLen + 2, cycleLen - 14);

  let phase: Phase;
  let phaseName: string;
  let phaseEmoji: string;

  if (cycleDay <= periodLen) {
    phase = 'menstrual'; phaseName = 'Menstrual'; phaseEmoji = '🌑';
  } else if (cycleDay < ovulationDay) {
    phase = 'follicular'; phaseName = 'Follicular'; phaseEmoji = '🌸';
  } else if (cycleDay <= ovulationDay + 1) {
    phase = 'ovulation'; phaseName = 'Ovulation'; phaseEmoji = '✨';
  } else {
    phase = 'luteal'; phaseName = 'Luteal'; phaseEmoji = '🌕';
  }

  const nextPeriodDate = addDays(cycleStart, cycleLen);
  const ovulationDate = addDays(cycleStart, ovulationDay - 1);
  const fertileStart = addDays(ovulationDate, -5);
  const fertileEnd = addDays(ovulationDate, 1);
  const daysToNextPeriod = Math.max(0, daysBetween(today, nextPeriodDate));

  const loggedDays = Object.keys(logs).length;
  const periodDays = Object.values(logs).filter(l => l.flow && l.flow !== 'none').length;
  const confidence = Math.min(0.93, 0.55 + Math.min(loggedDays, 30) * 0.008 + Math.min(periodDays, 10) * 0.015);
  return { cycleDay, cycleLength: cycleLen, phase, phaseName, phaseEmoji, daysToNextPeriod, nextPeriodDate, ovulationDate, fertileStart, fertileEnd, confidence };
}

export function getDayClass(date: Date, lastPeriod: Date, cycleLen: number, periodLen: number, logs: Record<string, DailyLog>): string[] {
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = daysBetween(lastPeriod, date);
  const pos = ((diff % cycleLen) + cycleLen) % cycleLen;
  const classes: string[] = [];

  if (dateKey(date) === dateKey(today)) classes.push('today');
  if (diff >= 0 && diff < cycleLen * 4) {
    if (pos < periodLen) classes.push('period');
    else if (pos === cycleLen - 15) classes.push('ovulation');
    else if (pos >= cycleLen - 20 && pos <= cycleLen - 14) classes.push('fertile');
    if (diff >= cycleLen && pos < periodLen) classes.push('predicted');
  }
  const log = logs[dateKey(date)];
  if (log) {
    classes.push('logged');
    if (log.flow && log.flow !== 'none' && !classes.includes('period')) classes.push('period');
  }
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

  if (m.match(/faint|unconscious|severe pain|soaking.*(hour|pad)|chest pain|trouble breathing/)) return `Those symptoms may need urgent medical care. Please contact local emergency services or seek urgent care now—especially for fainting, severe or sudden pain, breathing trouble, or bleeding that soaks a pad or tampon every hour. Luna cannot diagnose emergencies.`;
  if (m.match(/irregular|missed|late|skip/)) return `Cycles can vary with stress, travel, illness, weight changes, PCOS, thyroid conditions, and pregnancy. Take a pregnancy test if that is possible. Track dates and symptoms for 2–3 cycles, and contact a clinician if periods repeatedly fall outside 21–35 days, stop for 3 months, or the change worries you. Your current prediction is an estimate, not a diagnosis.`;
  if (m.match(/headache|migraine/)) return `Hormone shifts can trigger headaches. Try water, a regular meal, gentle movement, rest in a dark room, and your usual clinician-approved pain relief. Log timing and severity so you can spot a cycle pattern. Seek urgent care for a sudden “worst-ever” headache, weakness, confusion, or vision loss.`;
  if (m.match(/stress|anxious|anxiety/)) return `For your ${phaseName} phase, try a 10-minute reset: slow breathing, a short walk, water, and one small meal or snack. Keep today’s workload realistic and log anxiety plus sleep; patterns become more useful after several entries. If anxiety feels unsafe or persistent, contact a qualified professional.`;
  if (m.match(/skin|acne/)) return `Cycle-related acne often increases as progesterone and androgens shift. Keep skincare gentle: non-comedogenic cleanser, moisturiser, SPF, and avoid picking. Salicylic acid may help, but check product safety if pregnant or trying to conceive and ask a clinician about persistent or painful acne.`;
  if (m.match(/water|hydrat/)) return `Hydration can help with headaches, fatigue, and bloating. Sip regularly, add water-rich foods, and use thirst plus pale-yellow urine as practical guides. Heavy exercise, hot weather, vomiting, or diarrhoea may increase your needs.`;
  if (m.match(/tired|fatigue|energy|exhausted/)) return `On day ${cycleDay} in your ${phaseName} phase, ${pred.phase === 'luteal' ? 'progesterone can cause fatigue — totally normal.' : 'an energy dip can happen due to hormonal shifts.'} Try: ${pd.workout}. Also, ${pd.diet.toLowerCase()}.`;
  if (m.match(/cramp|pain|ache/)) return `Cramps are caused by prostaglandins contracting the uterus. Relief tips: heat therapy on your lower abdomen, ibuprofen (anti-inflammatory), magnesium-rich foods like dark chocolate and nuts, and gentle yoga poses like Child's Pose.`;
  if (m.match(/food|eat|diet|nutrition/)) return `In your ${phaseName} phase: ${pd.diet}. Your hormones directly influence what your body needs — eat with your cycle! ${pd.tip}`;
  if (m.match(/workout|exercise|gym|fitness/)) return `${phaseName} phase workout: ${pd.workout}. ${pred.phase === 'follicular' || pred.phase === 'ovulation' ? 'Estrogen is high — great time to push performance!' : 'Your body may need more recovery time — listen to it.'}`;
  if (m.match(/fertile|ovulation|conceive|pregnant/)) return `Your fertile window is ${fertileStart.toLocaleDateString('en-IN',{month:'short',day:'numeric'})}–${fertileEnd.toLocaleDateString('en-IN',{month:'short',day:'numeric'})} with ovulation expected ${ovulationDate.toLocaleDateString('en-IN',{month:'long',day:'numeric'})}. Sperm can survive 3–5 days, so the days just before ovulation are key.`;
  if (m.match(/period|next|when|due/)) return `Your next period is predicted ${nextPeriodDate.toLocaleDateString('en-IN',{month:'long',day:'numeric'})} — that's ${daysToNextPeriod} days away. I'll get more accurate as you log more cycles!`;
  if (m.match(/mood|pms|emotional|irritab/)) return `PMS symptoms typically peak in the luteal phase (days 17–28). You're on day ${cycleDay}. Evidence-based relief: regular exercise, magnesium supplements, reduced caffeine, and stress management. If symptoms are severe, it's worth speaking to a doctor about PMDD.`;
  if (m.match(/sleep/)) return `Sleep quality shifts with your cycle. During ${phaseName}: progesterone${pred.phase === 'luteal' ? ' can cause early drowsiness but also night waking' : ' levels are lower, which often means lighter sleep'}. Try magnesium glycinate before bed, keep a consistent schedule, and avoid screens 1 hour before sleep.`;
  if (m.match(/hi|hello|hey/)) return `Hi! I'm Luna 🌙 You're on day ${cycleDay} of your cycle — ${phaseName} phase. ${daysToNextPeriod} days until your next period. What can I help you with today?`;
  return `You're currently in your ${phaseName} phase (day ${cycleDay}). ${pd.tip}\n\nA useful plan for today:\n• Movement: ${pd.workout}\n• Food: ${pd.diet}\n• Check in: log flow, pain, mood, energy, and sleep\n\nYou can ask about cramps, headaches, acne, irregular cycles, stress, hydration, nutrition, workouts, sleep, or fertility. Predictions are estimates and Luna is not a substitute for medical care.`;
}
