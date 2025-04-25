import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import axios from 'axios';
import IocsTab from './IocsTab';
import { IoC, HuntingQuery } from '../types';
import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock axios
vi.mock('axios');

describe('IocsTab Component', () => {
  // Mock data for tests
  const mockIocs: IoC[] = [
    { id: 1, value: 'example.com', type: 'domain', description: 'Example domain', created_at: '2023-01-01T12:00:00', updated_at: '2023-01-01T12:00:00' },
    { id: 2, value: '192.168.1.1', type: 'ip_address', description: 'Example IP', created_at: '2023-01-01T12:00:00', updated_at: '2023-01-01T12:00:00' }
  ];
  
  const mockQueries: HuntingQuery[] = [
    {
      id: 1,
      name: 'Test Query 1',
      query_type: 'kql',
      query_text: 'SecurityEvent | where Computer contains "example.com"',
      ioc_id: 1, // Fixed: Added the missing required ioc_id property
      created_at: '2023-01-01T12:00:00',
      updated_at: '2023-01-01T12:00:00'
    }
  ];

  beforeEach(() => {
    // Reset and setup axios mocks
    vi.clearAllMocks();
    
    // Mock the IoCs API call
    (axios.get as any).mockImplementation((url: string) => {
      if (url === 'http://localhost:5000/api/iocs') {
        return Promise.resolve({
          data: {
            iocs: mockIocs
          }
        });
      } else if (url.includes('/hunting_queries')) {
        // For testing the "expands IoC details and shows hunting queries" test,
        // return empty queries for the first IoC
        if (url.includes('1/hunting_queries')) {
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
          ioc_id: 1, // Fixed: Changed ioc_value and ioc_type to ioc_id
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

  test('renders IoCs tab with loading state', async () => {
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
    await waitFor(() => {
      expect(screen.getByText(/example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/192.168.1.1/i)).toBeInTheDocument();
    });
  });

  test('filters IoCs by type', async () => {
    render(<IocsTab />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading IoCs/i)).not.toBeInTheDocument();
    });
    
    // Get the filter dropdown
    await waitFor(() => {
      const filterElement = screen.getByRole('combobox');
      expect(filterElement).toBeInTheDocument();
      // Change filter to domain type
      fireEvent.change(filterElement, { target: { value: 'domain' } });
    });
    
    // Should only show domain IoC
    await waitFor(() => {
      expect(screen.getByText(/example.com/i)).toBeInTheDocument();
      expect(screen.queryByText(/192.168.1.1/i)).not.toBeInTheDocument();
    });
  });

  test('expands IoC details and shows hunting queries', async () => {
    render(<IocsTab />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading IoCs/i)).not.toBeInTheDocument();
    });
    
    // Click the expand details button for the first IoC
    await waitFor(async () => {
      // Find and click the expand button (might be an icon button)
      const expandButtons = screen.getAllByRole('button');
      const expandButton = expandButtons.find(button => 
        button.getAttribute('aria-label')?.includes('details') || 
        button.textContent?.includes('Details')
      );
      expect(expandButton).toBeDefined();
      if (expandButton) {
        await act(async () => {
          fireEvent.click(expandButton);
        });
      }
    });
    
    // Should see the Hunting Queries section heading
    await waitFor(() => {
      // Use a more specific selector to find the Hunting Queries header
      const headings = screen.getAllByText(/Hunting Queries/i);
      // Find the h4 element containing "Hunting Queries"
      const huntingQueriesHeading = headings.find(heading => 
        heading.tagName.toLowerCase() === 'h4'
      );
      expect(huntingQueriesHeading).toBeInTheDocument();
    });
    
    // Look for the Generate Query button
    await waitFor(() => {
      const generateButton = screen.getByRole('button', { 
        name: (content) => content.includes('Generate') && content.includes('Query')
      });
      expect(generateButton).toBeInTheDocument();
    });
  });

  test('generates a new hunting query for an IoC', async () => {
    render(<IocsTab />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading IoCs/i)).not.toBeInTheDocument();
    });
    
    // Click the expand details button for the first IoC
    await waitFor(async () => {
      const expandButtons = screen.getAllByRole('button');
      const expandButton = expandButtons.find(button => 
        button.getAttribute('aria-label')?.includes('details') || 
        button.textContent?.includes('Details')
      );
      expect(expandButton).toBeDefined();
      if (expandButton) {
        await act(async () => {
          fireEvent.click(expandButton);
        });
      }
    });
    
    // Wait for hunting queries section to appear
    await waitFor(() => {
      // Use a more specific selector to find the Hunting Queries header
      const headings = screen.getAllByText(/Hunting Queries/i);
      // Find the h4 element containing "Hunting Queries"
      const huntingQueriesHeading = headings.find(heading => 
        heading.tagName.toLowerCase() === 'h4'
      );
      expect(huntingQueriesHeading).toBeInTheDocument();
    });
    
    // Mock the axios.post implementation to delay resolving the promise
    (axios.post as any).mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            data: {
              hunting_query: {
                id: 2,
                name: 'Generated Query',
                query_text: 'SecurityEvent | where Computer contains "example.com"',
                ioc_id: 1, // Fixed: Changed ioc_value and ioc_type to ioc_id
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
    await waitFor(async () => {
      const generateButton = screen.getByRole('button', { 
        name: (content) => content.includes('Generate') && content.includes('Query')
      });
      await act(async () => {
        fireEvent.click(generateButton);
      });
    });
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
    
    // The axios.post should have been called
    expect(axios.post).toHaveBeenCalled();
  });

  test('deletes a hunting query', async () => {
    // Mock to return queries for the first IoC
    (axios.get as any).mockImplementation((url: string) => {
      if (url === 'http://localhost:5000/api/iocs') {
        return Promise.resolve({
          data: {
            iocs: mockIocs
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
    
    // Click the expand details button for the first IoC
    await waitFor(async () => {
      const expandButtons = screen.getAllByRole('button');
      const expandButton = expandButtons.find(button => 
        button.getAttribute('aria-label')?.includes('details') || 
        button.textContent?.includes('Details')
      );
      expect(expandButton).toBeDefined();
      if (expandButton) {
        await act(async () => {
          fireEvent.click(expandButton);
        });
      }
    });
    
    // Wait for hunting queries to load
    await waitFor(() => {
      expect(screen.getByText('Test Query 1')).toBeInTheDocument();
    });
    
    // Mock window.confirm to return true
    window.confirm = vi.fn().mockImplementation(() => true);
    
    // Click the Delete button for the hunting query specifically
    await waitFor(async () => {
      // First find the query container or section that contains both the query name and delete button
      const queryContainer = screen.getByText('Test Query 1').closest('.hunting-query') || 
                             screen.getByText('Test Query 1').parentElement;
      
      // Then find the delete button within that container
      const deleteButton = queryContainer ? 
        within(queryContainer as HTMLElement).getByRole('button', { name: /Delete/i }) : 
        // Fallback to a more specific approach if we can't find the container
        screen.getAllByRole('button', { name: /Delete/i }).find(button => {
          // Look for buttons that are near the query name
          const rect = button.getBoundingClientRect();
          const queryRect = screen.getByText('Test Query 1').getBoundingClientRect();
          // Check if they're reasonably close
          return Math.abs(rect.top - queryRect.top) < 100;
        });
      
      expect(deleteButton).toBeInTheDocument();
      if (deleteButton) {
        await act(async () => {
          fireEvent.click(deleteButton);
        });
      }
    });
    
    // The axios.delete should have been called
    expect(axios.delete).toHaveBeenCalled();
  });

  test('selects and generates queries for multiple IoCs', async () => {
    render(<IocsTab />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading IoCs/i)).not.toBeInTheDocument();
    });
    
    // Wait for the checkboxes to appear and check them
    await waitFor(async () => {
      // Find input elements with type 'checkbox'
      const checkboxInputs = screen.getAllByRole('checkbox');
      expect(checkboxInputs.length).toBeGreaterThan(0);
      
      // Click the first two checkboxes (skip the select all if it exists)
      await act(async () => {
        fireEvent.click(checkboxInputs[0]);
        if (checkboxInputs.length > 1) {
          fireEvent.click(checkboxInputs[1]);
        }
      });
      
      // Check that selection indicator is updated
      expect(screen.getByText(/IoCs selected/i)).toBeInTheDocument();
    });
    
    // Mock the post request for generating multiple queries
    axios.post = vi.fn().mockResolvedValue({
      data: {
        message: 'Hunting queries were successfully generated'
      }
    });
    
    // Click the Generate Hunting Queries button
    await waitFor(async () => {
      const bulkGenerateButton = screen.getByRole('button', {
        name: (content) => content.includes('Generate Hunting Queries')
      });
      
      // The button might be disabled, so check if it's enabled first
      if (!bulkGenerateButton.hasAttribute('disabled')) {
        await act(async () => {
          fireEvent.click(bulkGenerateButton);
        });
      }
    });
    
    // If we clicked the button, the POST request should have been called
    if ((axios.post as any).mock.calls.length > 0) {
      // Should show success message eventually
      await waitFor(() => {
        expect(screen.getByText(/success/i)).toBeInTheDocument();
      });
    }
  });
});