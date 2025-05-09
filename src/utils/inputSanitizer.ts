/**
 * Detects potentially suspicious patterns in user input
 * @param input User input string
 * @returns Boolean indicating if suspicious patterns were detected
 */
export const detectSuspiciousPatterns = (input: string): boolean => {
  // Check for system prompt injection attempts
  const systemPromptPatterns = [
    /system:\s/i,
    /ignore previous instructions/i,
    /ignore all previous commands/i,
    /new instructions:/i,
    /you are now/i,
    /\<\/?system\>/i
  ];
  
  // Check for delimiter manipulation
  const delimiterPatterns = [
    /\<\/?user\>/i,
    /\<\/?assistant\>/i,
    /\<\/?message\>/i,
    /\<\/?thinking\>/i,
    /\<\/?function_call\>/i,
    /\<\/?tool_calls\>/i
  ];
  
  // Combine all patterns
  const allPatterns = [...systemPromptPatterns, ...delimiterPatterns];
  
  // Check if any pattern matches
  return allPatterns.some(pattern => pattern.test(input));
};

/**
 * Sanitizes user input to prevent prompt injection and other attacks
 * @param input User input string
 * @returns Sanitized input string
 */
export const sanitizeUserInput = (input: string): string => {
  if (!input) return '';
  
  // Remove or escape potential XML/HTML tags
  let sanitized = input
    .replace(/\<(?!!\[CDATA\[)([^\>]+)\>/g, '&lt;$1&gt;')
    
    // Neutralize potential system prompt injection attempts
    .replace(/system:/gi, 'syst\u200Bem:')
    .replace(/ignore previous instructions/gi, 'igno\u200Bre previous instructions')
    
    // Limit excessive repetition (potential flooding)
    .replace(/(.{50,}?)\1{10,}/gs, '$1 [repeated content removed]');
  
  // Normalize whitespace
  sanitized = sanitized.trim();
  
  // Limit overall length if needed
  const MAX_LENGTH = 100000; // Adjust as needed
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH) + ' [truncated]';
  }
  
  return sanitized;
};