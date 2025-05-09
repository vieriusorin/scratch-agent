/**
 * Represents the result of an evaluation
 */
export interface EvalResult {
  id?: string;
  input: any;
  expected?: any;
  output?: any;
  score?: number;
  success: boolean;
  error?: any;
  responseTime?: number;
  metadata?: Record<string, any>;
  timestamp?: string;
} 