import React from 'react';

interface StatusMessageProps {
  loading: boolean;
  error: string | null;
  showSuccessMessage: boolean;
  successMessage?: string; // Add optional successMessage prop
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ 
  loading, 
  error, 
  showSuccessMessage,
  successMessage = "Operation completed successfully" // Default value if not provided
}) => (
  <>
    {loading && (
      <div className="flex justify-center items-center my-10 text-muted-foreground">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading IoCs...
      </div>
    )}
    {error && (
      <div className="text-destructive bg-destructive/10 p-3 rounded-md my-4 text-center animate-in fade-in slide-in-from-top-5 duration-300 border border-destructive/20">
        <div className="flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      </div>
    )}
    {showSuccessMessage && (
      <div className="text-green-500 bg-green-900/20 border border-green-500/20 p-3 rounded-md my-4 text-center font-medium animate-in fade-in slide-in-from-top-5 duration-300">
        <div className="flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      </div>
    )}
  </>
);