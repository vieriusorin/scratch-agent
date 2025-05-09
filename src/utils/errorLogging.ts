/**
 * Logs errors to a service or file
 * @param errorData - The error data to log
 * @returns Promise that resolves when the error is logged
 */
export const logErrorToService = async (errorData: {
  toolName: string;
  error: string;
  stack?: string;
  timestamp?: string;
}) => {
  // Log to console for development
  console.error('Tool Error:', errorData);
  
  // In a production environment, you might want to send this to a logging service
  // like Sentry, LogRocket, or your own backend API
  
  if (process.env.NODE_ENV === 'production') {
    try {
      // Example: Send to a logging endpoint
      // const response = await fetch('/api/logs/error', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(errorData)
      // });
      
      // return response.ok;
    } catch (loggingError) {
      // Don't let logging errors cause more problems
      console.error('Failed to log error to service:', loggingError);
    }
  }
  
  // Optionally log to a local file in development
  // This would require a Node.js environment or Electron
  
  return true;
}; 

export const logSecurityEvent = async (eventData: {
  eventType: 'pattern_injection' | 'context_shift' | 'repeated_attempts' | 'suspicious_activity';
  userMessage: string;
  confidence?: number;
  reasoning?: string;
  timestamp?: string;
}) => {
  // Add timestamp if not provided
  if (!eventData.timestamp) {
    eventData.timestamp = new Date().toISOString();
  }
  
  // Log to console for development
  console.error('Security Event:', eventData);
  
  // In a production environment, send to security monitoring system
  if (process.env.NODE_ENV === 'production') {
    try {
      // Example: Send to a security monitoring endpoint
      // const response = await fetch('/api/security/events', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(eventData)
      // });
      
      // return response.ok;
    } catch (loggingError) {
      console.error('Failed to log security event:', loggingError);
    }
  }
  
  return true;
};