import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});

test('starts with private onboarding for a new user', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Meet Luna Cycle/i })).toBeInTheDocument();
  expect(screen.getByText(/remain in your browser/i)).toBeInTheDocument();
});

test('restores a saved local profile', () => {
  localStorage.setItem('luna-cycle-private-v2', JSON.stringify({
    userName: 'Maya',
    mode: 'period',
    lastPeriodDate: new Date().toISOString(),
    cycleLength: 28,
    periodLength: 5,
    periodStarts: [new Date().toISOString().slice(0, 10)],
    logs: {},
    settings: { darkMode: true, periodReminder: true, ovulationReminder: false, logReminder: true, units: 'metric', storage: 'local' }
  }));
  render(<App />);
  expect(screen.getByRole('heading', { name: /Hello, Maya/i })).toBeInTheDocument();
});
