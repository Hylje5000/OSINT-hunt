import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders OSINT-Hunt Platform title', () => {
  render(<App />);
  // Use a more specific query to target only the header h1 element
  const titleElement = screen.getByRole('heading', { level: 1, name: /OSINT-Hunt Platform/i });
  expect(titleElement).toBeInTheDocument();
});