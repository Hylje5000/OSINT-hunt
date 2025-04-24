import axios from 'axios';
import { HuntingQuery } from '../../types';

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Format hunting query to properly display line breaks
export const formatQueryText = (queryText: string): string => {
  if (!queryText) return '';
  // Replace literal \n strings with actual line breaks
  return queryText.replace(/\\n/g, '\n');
};

// Format date for display
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Fetch hunting queries for an IoC
export const fetchIocQueries = async (iocValue: string): Promise<HuntingQuery[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/iocs/${encodeURIComponent(iocValue)}/hunting_queries`);
    return response.data.hunting_queries;
  } catch (err) {
    console.error('Error fetching hunting queries for IoC:', err);
    return [];
  }
};