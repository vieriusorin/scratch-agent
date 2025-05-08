
/**
 * Configuration for the evaluation
 * 
 * @description The configuration for the evaluation
 * @property concurrency - The number of concurrent evaluations
 * @satisfies {number}
 * @property maxRetries - The maximum number of retries for an evaluation
 * @satisfies {number}
 * @property retryBackoffMultiplier - The multiplier for the retry backoff
 * @satisfies {number}
 * @property maxRetryBackoffMs - The maximum retry backoff time
 * @satisfies {number}
 * @property initialRetryDelayMs - The initial retry delay time
 * @satisfies {number}
 * @property progressInterval - The interval to report progress
 * @satisfies {number}
 * @property dbPath - The path to the database
 * @satisfies {string}
 * @property logLevel - The log level
 * @satisfies {string}
 * @property confidenceLevel - The confidence level
 * @satisfies {number}
 * @property experimentsDir - The directory to save the experiments
 * @satisfies {string}
 * @property [key: string]: any - Any other custom config
 * @satisfies {Record<string, any>}

 */
export interface EvalConfig {
    // Evaluation parameters
    concurrency: number;
    maxRetries: number;
    retryBackoffMultiplier: number;
    maxRetryBackoffMs: number;
    initialRetryDelayMs: number;
    
    // Reporting
    progressInterval: number;
    
    // Database
    dbPath: string;
    
    // Logging
    logLevel: string;
    
    // Statistics
    confidenceLevel: number;
    
    // Paths
    experimentsDir?: string;
    
    // Any other custom config
    [key: string]: any;
  }