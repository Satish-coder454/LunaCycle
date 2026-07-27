import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => localStorage.clear());

test('starts with onboarding for a new user', () => {
  render(<App />);
  expect(screen.getByText(/Welcome to Luna/i)).toBeInTheDocument();
});

test('restores a saved profile instead of asking the user to log in again', () => {
  localStorage.setItem('luna-cycle-state-v1', JSON.stringify({
    userName: 'Maya',
    mode: 'period',
    lastPeriodDate: new Date().toISOString(),
    cycleLength: 28,
    periodLength: 5,
    logs: {}
  }));
  render(<App />);
  expect(screen.getByRole('heading', { name: /Maya/i })).toBeInTheDocument();
});
