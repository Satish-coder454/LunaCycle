# 🌙 Luna — Period Tracker

## Quick Start

**Option 1 — Run the dev server (with live reload)**
```bash
npm install
npm start
```
Opens at: http://localhost:3000

**Option 2 — Serve the production build (faster)**
```bash
npx serve -s build
```
Opens at: http://localhost:3000

## What's inside

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root app + screen routing |
| `src/engine.ts` | AI cycle prediction engine |
| `src/types.ts` | TypeScript types |
| `src/components/Onboarding.tsx` | 4-step setup flow |
| `src/components/Layout.tsx` | Shell + bottom nav |
| `src/components/Home.tsx` | Dashboard with cycle ring |
| `src/components/CalendarView.tsx` | Interactive calendar |
| `src/components/LogDay.tsx` | Daily mood/symptom logger |
| `src/components/Insights.tsx` | Charts + health analytics |
| `src/components/AIChat.tsx` | Luna AI chatbot |

## Tech stack
- React 18 + TypeScript
- Recharts (graphs)
- DM Sans + DM Serif Display (fonts)

## Features
- AI cycle prediction (weighted average engine)
- 4 hormonal phase tracking
- Mood, symptom, flow, energy, sleep logging
- Interactive color-coded calendar
- Health insights with bar/line charts
- Luna AI chatbot with 10+ topic responses
- 3 tracking modes: Period, Conceive, Pregnancy
- Beautiful gradient UI with phase-adaptive colors
