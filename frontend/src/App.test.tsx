import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders OSINT-Hunt Platform title', () => {
  render(<App />);
  const titleElement = screen.getByText(/OSINT-Hunt Platform/i);
  expect(titleElement).toBeInTheDocument();
});