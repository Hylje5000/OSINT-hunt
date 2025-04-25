import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import axios from 'axios';
import IocsTab from './IocsTab';
import { IoC, HuntingQuery } from '../types';
import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock axios
vi.mock('axios');

describe('IocsTab Component', () => {
  // Mock data for tests
  const mockIocs: IoC[] = [
    { value: 'example.com', type: 'domain', description: 'Example domain' },
    { value: '192.168.1.1', type: 'ip_address', description: 'Example IP' }
  ];
  
  const mockQueries: HuntingQuery[] = [
    {
      id: 1,
      name: 'Test Query 1',
      query_type: 'kql',
      query_text: 'SecurityEvent | where Computer contains "example.com"',
      ioc_value: 'example.com',
      ioc_type: 'domain',
      created_at: '2023-01-01T12:00:00',
      updated_at: '2023-01-01T12:00:00'
    }
  ];

  beforeEach(() => {
    // Reset and setup axios mocks
    vi.clearAllMocks();
    
    // Mock the reports API call
    (axios.get as any).mockImplementation((url: string) => {
      if (url === 'http://localhost:5000/api/reports') {
        return Promise.resolve({
          data: {
            reports: [
              { 
                id: 1, 
                name: 'Test Report', 
                iocs: mockIocs,
                source: 'Test Source',
                created_at: '2023-01-01T12:00:00',
                updated_at: '2023-01-01T12:00:00'
              }
            ]
          }
        });
      } else if (url.includes('/hunting_queries')) {
        // For testing the "expands IoC details and shows hunting queries" test,
        // return empty queries so the Generate Query button will appear
        if (url.includes('example.com') && url.includes('/hunting_queries')) {
          return Promise.resolve({
            data: {
              hunting_queries: []
            }
          });
        }
        // For other tests, return the mock queries
        return Promise.resolve({
          data: {
            hunting_queries: mockQueries
          }
        });
      }
      
      return Promise.reject(new Error('Not found'));
    });
    
    // Mock the generate query POST call
    (axios.post as any).mockResolvedValue({
      data: {
        hunting_query: {
          id: 2,
          name: 'Generated Query',
          query_text: 'SecurityEvent | where Computer contains "example.com"',
          ioc_value: 'example.com',
          ioc_type: 'domain',
          query_type: 'kql',
          created_at: '2023-01-01T12:00:00',
          updated_at: '2023-01-01T12:00:00'
        },
        message: 'Hunting query generated and saved successfully'
      }
    });
    
    // Mock the delete query call
    (axios.delete as any).mockResolvedValue({
      data: {
        message: 'Hunting query deleted successfully'
      }
    });
  });

  test('renders IoCs tab with loading state', () => {
    render(<IocsTab />);
    expect(screen.getByText(/Loading IoCs/i)).toBeInTheDocument();
  });

  test('renders IoCs list after loading', async () => {
    render(<IocsTab />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading IoCs/i)).not.toBeInTheDocument();
    });
    
    // Should show both IoCs
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  test('filters IoCs by type', async () => {
    render(<IocsTab />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading IoCs/i)).not.toBeInTheDocument();
    });
    
    // Get the filter dropdown and change to filter by domain type
    const filterDropdown = screen.getByLabelText(/Filter by type/i);
    fireEvent.change(filterDropdown, { target: { value: 'domain' } });
    
    // Should only show domain IoC
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.queryByText('192.168.1.1')).not.toBeInTheDocument();
  });

  test('expands IoC details and shows hunting queries', async () => {
    render(<IocsTab />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading IoCs/i)).not.toBeInTheDocument();
    });
    
    // Click the Show Details button for the first IoC
    await act(async () => {
      const detailsButton = screen.getAllByText('Show Details')[0];
      fireEvent.click(detailsButton);
    });
    
    // Should see the Hunting Queries section
    await waitFor(() => {
      expect(screen.getByText('Hunting Queries')).toBeInTheDocument();
    });
    
    // Look for the Generate Query button by its containing text and icon
    const generateButton = screen.getByRole('button', { name: /Generate Query/ });
    expect(generateButton).toBeInTheDocument();
  });

  test('generates a new hunting query for an IoC', async () => {
    render(<IocsTab />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading IoCs/i)).not.toBeInTheDocument();
    });
    
    // Click the Show Details button for the first IoC
    await act(async () => {
      const detailsButton = screen.getAllByText('Show Details')[0];
      fireEvent.click(detailsButton);
    });
    
    // Wait for hunting queries section to appear
    await waitFor(() => {
      expect(screen.getByText('Hunting Queries')).toBeInTheDocument();
    });
    
    // Mock the axios.post implementation to delay resolving the promise
    // This gives the UI time to show the loading state
    (axios.post as any).mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            data: {
              hunting_query: {
                id: 2,
                name: 'Generated Query',
                query_text: 'SecurityEvent | where Computer contains "example.com"',
                ioc_value: 'example.com',
                ioc_type: 'domain',
                query_type: 'kql',
                created_at: '2023-01-01T12:00:00',
                updated_at: '2023-01-01T12:00:00'
              },
              message: 'Hunting query generated and saved successfully'
            }
          });
        }, 100);
      });
    });
    
    // Click the Generate Query button
    await act(async () => {
      const generateButton = screen.getByRole('button', { name: /Generate Query/ });
      fireEvent.click(generateButton);
    });
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/Hunting queries were successfully generated/i)).toBeInTheDocument();
    });
    
    // The axios.post should have been called with the correct parameters
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/iocs/example.com/generate_query',
      expect.objectContaining({
        ioc_type: 'domain'
      })
    );
  });

  test('deletes a hunting query', async () => {
    (axios.get as any).mockImplementation((url: string) => {
      if (url === 'http://localhost:5000/api/reports') {
        return Promise.resolve({
          data: {
            reports: [
              { 
                id: 1, 
                name: 'Test Report', 
                iocs: mockIocs,
                source: 'Test Source',
                created_at: '2023-01-01T12:00:00',
                updated_at: '2023-01-01T12:00:00'
              }
            ]
          }
        });
      } else if (url.includes('/hunting_queries')) {
        return Promise.resolve({
          data: {
            hunting_queries: mockQueries
          }
        });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    render(<IocsTab />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading IoCs/i)).not.toBeInTheDocument();
    });
    
    // Click the Show Details button for the first IoC
    await act(async () => {
      const detailsButton = screen.getAllByText('Show Details')[0];
      fireEvent.click(detailsButton);
    });
    
    // Wait for hunting queries to load
    await waitFor(() => {
      expect(screen.getByText('Test Query 1')).toBeInTheDocument();
    });
    
    // Mock window.confirm to return true
    window.confirm = vi.fn().mockImplementation(() => true);
    
    // Click the Delete button
    await act(async () => {
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
    });
    
    // The axios.delete should have been called with the correct parameters
    expect(axios.delete).toHaveBeenCalledWith('http://localhost:5000/api/hunting_queries/1');
  });

  test('selects and generates queries for multiple IoCs', async () => {
    render(<IocsTab />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading IoCs/i)).not.toBeInTheDocument();
    });
    
    // Get checkboxes and select both IoCs
    const checkboxes = screen.getAllByRole('checkbox').slice(1); // Skip the select all checkbox
    
    await act(async () => {
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);
    });
    
    // Check that selection count updates
    expect(screen.getByText('2 IoCs selected')).toBeInTheDocument();
    
    // Mock the post request for generating multiple queries
    axios.post = vi.fn().mockResolvedValue({
      data: {
        message: 'Hunting queries were successfully generated'
      }
    });
    
    // Click the Generate Hunting Queries button
    await act(async () => {
      const bulkGenerateButton = screen.getByText(/Generate Hunting Queries/);
      fireEvent.click(bulkGenerateButton);
    });
    
    // Wait for the POST request to be called
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
    
    // Check that the post request was called with the correct parameters
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/iocs/generate_queries',
      expect.objectContaining({
        iocs: expect.any(Array),
        save: true,
        generate_individual_queries: true
      })
    );
    
    // Should show success message eventually
    await waitFor(() => {
      expect(screen.getByText(/Hunting queries were successfully generated/i)).toBeInTheDocument();
    });
  });
});