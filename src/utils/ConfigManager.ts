
import fs from 'fs/promises';
/**
 * ConfigManager is a class that manages the configuration for the autoevals library.   
 * It is used to get and set the configuration for the library.
 * The configuration is stored in the config.json file.
 * The configuration is a JSON object that contains the following properties:
 * - concurrency: the number of concurrent evaluations
 * - maxRetries: the maximum number of retries for the library
 * - retryBackoffMultiplier: the multiplier for the retry backoff
 * - maxRetryBackoffMs: the maximum retry backoff
 * - initialRetryDelayMs: the initial retry delay
 * - progressInterval: the interval for the progress reporting
 * - dbPath: the path to the database file
 * - logLevel: the log level for the library
 * - confidenceLevel: the confidence level for the library
 */
export class ConfigManager {
  // Default configuration values
  private config: Record<string, any> = {
    // Evaluation defaults
    concurrency: 5,
    maxRetries: 3,
    retryBackoffMultiplier: 2,
    maxRetryBackoffMs: 30000,
    initialRetryDelayMs: 1000,
    
    // Reporting
    progressInterval: 5, // Report progress every 5%
    
    // Database
    dbPath: 'results.json',
    
    // Logging
    logLevel: 'info',
    
    // Statistics
    confidenceLevel: 0.95
  };

  /**
   * Get a configuration value
   * @param key - The configuration key
   * @param defaultValue - Optional fallback value if key doesn't exist
   * @returns The configuration value or defaultValue
   */
  get<T>(key: string, defaultValue?: T): T {
    if (key in this.config) {
      return this.config[key] as T;
    }
    
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    
    throw new Error(`Configuration key "${key}" not found and no default provided`);
  }

  /**
   * Set a configuration value
   * @param key - The configuration key
   * @param value - The value to set
   */
  set(key: string, value: any): void {
    this.config[key] = value;
  }

  /**
   * Set multiple configuration values at once
   * @param configObject - Object containing key-value pairs to set
   */
  update(configObject: Record<string, any>): void {
    this.config = {
      ...this.config,
      ...configObject
    };
  }

  /**
   * Load configuration from a JSON file
   * @param filePath - Path to the configuration file
   */
  async loadFromFile(filePath: string): Promise<void> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const fileConfig = JSON.parse(fileContent);
      this.update(fileConfig);
      console.log(`Configuration loaded from ${filePath}`);
    } catch (error) {
      console.warn(`Failed to load configuration from ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Load configuration from environment variables with a specific prefix
   * @param prefix - Prefix for environment variables (e.g., 'EVAL_')
   */
  loadFromEnvironment(prefix: string = 'EVAL_'): void {
    const envVars = Object.entries(process.env)
      .filter(([key]) => key.startsWith(prefix))
      .reduce((acc, [key, value]) => {
        // Convert EVAL_MAX_RETRIES to maxRetries
        const configKey = key
          .slice(prefix.length)
          .toLowerCase()
          .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        
        // Try to parse values as JSON (for numbers, booleans, etc.)
        let parsedValue = value;
        try {
          parsedValue = JSON.parse(value as string);
        } catch {
          // If parsing fails, use the string value
        }
        
        return { ...acc, [configKey]: parsedValue };
      }, {});
    
    this.update(envVars);
  }

  /**
   * Save current configuration to a file
   * @param filePath - Path where to save the configuration
   */
  async saveToFile(filePath: string): Promise<void> {
    try {
      await fs.writeFile(
        filePath, 
        JSON.stringify(this.config, null, 2),
        'utf-8'
      );
      console.log(`Configuration saved to ${filePath}`);
    } catch (error) {
      console.error(`Failed to save configuration to ${filePath}:`, error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const configManager = new ConfigManager();