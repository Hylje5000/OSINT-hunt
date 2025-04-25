import axios from 'axios';
import { HuntingQuery } from '../../types';

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Mapping of backend IoC types to human-readable display names
export const IOC_TYPE_DISPLAY_NAMES: Record<string, string> = {
  'HASH_MD5': 'MD5 Hash',
  'HASH_SHA1': 'SHA1 Hash',
  'HASH_SHA256': 'SHA256 Hash',
  'IP_ADDRESS': 'IP Address',
  'DOMAIN': 'Domain Name',
  'URL': 'URL',
  'EMAIL': 'Email Address',
  'REGISTRY_KEY': 'Registry Key',
  'UNKNOWN': 'Unknown'
};

// Convert IoC type to human-readable display name
export const getIocTypeDisplayName = (type: string): string => {
  // Check if the type exists in our mapping
  if (type && IOC_TYPE_DISPLAY_NAMES[type]) {
    return IOC_TYPE_DISPLAY_NAMES[type];
  }
  
  // Fallback for unknown types - convert from snake_case or SCREAMING_SNAKE_CASE to Title Case
  if (type) {
    return type
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  return 'Unknown';
};

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