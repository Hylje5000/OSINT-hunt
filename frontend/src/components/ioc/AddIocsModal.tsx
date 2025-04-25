import React, { useState } from 'react';
import axios from 'axios';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { IoC } from '../../types';
import { cn } from "../../lib/utils";

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface AddIocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIocsAdded: () => void;
}

export const AddIocsModal: React.FC<AddIocsModalProps> = ({ isOpen, onClose, onIocsAdded }) => {
  const [iocText, setIocText] = useState<string>('');
  const [generateQueries, setGenerateQueries] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!iocText.trim()) {
      setError("Please add at least one IoC.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Split text by new lines, commas, or semicolons and trim whitespace
      const rawValues = iocText
        .split(/[\n,;]+/)
        .map(value => value.trim())
        .filter(value => value.length > 0);
      
      // Process and structure the IoCs
      // Using more specific type detection aligned with backend IoC_Type enum
      const iocs = rawValues.map(value => {
        // Default to unknown
        let type = 'UNKNOWN';
        
        // MD5 Hash detection (32 characters)
        if (/^[a-fA-F0-9]{32}$/.test(value)) {
          type = 'HASH_MD5';
        }
        // SHA1 Hash detection (40 characters)
        else if (/^[a-fA-F0-9]{40}$/.test(value)) {
          type = 'HASH_SHA1';
        }
        // SHA256 Hash detection (64 characters)
        else if (/^[a-fA-F0-9]{64}$/.test(value)) {
          type = 'HASH_SHA256';
        }
        // IP Address detection
        else if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value)) {
          type = 'IP_ADDRESS';
        }
        // Domain detection - consistent with backend IoC_Type.DOMAIN
        else if (/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(value)) {
          type = 'DOMAIN';
        }
        // URL detection
        else if (value.startsWith('http://') || value.startsWith('https://') || /^(?:[-\w.]|(?:%[\da-fA-F]{2}))+\/[^\/\s]*/.test(value)) {
          type = 'URL';
        }
        // Email detection
        else if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
          type = 'EMAIL';
        }
        // Registry Key detection
        else if (/^(HKLM|HKCU|HKCR|HKU|HKCC)\\/.test(value)) {
          type = 'REGISTRY_KEY';
        }
        
        return {
          value,
          type,
          description: `Added via bulk import on ${new Date().toLocaleDateString()}`
        };
      });

      // Send to the new API endpoint
      const response = await axios.post(`${API_URL}/api/iocs`, {
        iocs,
        generate_queries: generateQueries,
        source: 'Manual Import'
      });
      
      // Clear form and notify parent
      setIocText('');
      onIocsAdded();
      onClose();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to add IoCs: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Indicators of Compromise" maxWidth="650px">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="ioc-input" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Paste IoCs (one per line, or comma/semicolon separated)
          </label>
          <textarea
            id="ioc-input"
            className={cn(
              "flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            )}
            value={iocText}
            onChange={(e) => setIocText(e.target.value)}
            placeholder="example.com&#10;192.168.1.1&#10;https://malicious-url.com&#10;44d88612fea8a8f36de82e1278abb02f"
            aria-describedby="ioc-input-description"
          />
          <p id="ioc-input-description" className="text-sm text-muted-foreground">
            Types supported: IP addresses, domains, URLs, MD5/SHA1/SHA256 hashes, email addresses, registry keys
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="generate-queries"
              className={cn(
                "h-4 w-4 rounded border border-primary text-primary shadow focus:outline-none",
                "focus:ring-2 focus:ring-ring focus:ring-offset-2"
              )}
              checked={generateQueries}
              onChange={(e) => setGenerateQueries(e.target.checked)}
            />
            <label 
              htmlFor="generate-queries"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Automatically generate hunting queries for these IoCs
            </label>
          </div>
        </div>
        
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}
        
        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !iocText.trim()}
            variant="default"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : 'Add IoCs'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};