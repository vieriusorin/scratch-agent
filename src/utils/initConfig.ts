import path from 'path';
import { configManager } from './ConfigManager';

/**
 * Initializes the configuration system by loading from different sources
 * in a specific order: defaults, file configs, environment variables
 * 
 * @param configDir - Directory containing configuration files
 * @param environment - Current environment (development, production, etc.)
 */
export async function initializeConfig(
  configDir: string = 'config',
  environment: string = process.env.NODE_ENV || 'development'
): Promise<void> {
  try {
    // First load default configuration
    const defaultConfigPath = path.resolve(configDir, 'default.json');
    await configManager.loadFromFile(defaultConfigPath);
    
    // Then load environment-specific configuration (if exists)
    try {
      const envConfigPath = path.resolve(configDir, `${environment}.json`);
      await configManager.loadFromFile(envConfigPath);
    } catch (error) {
      console.log(`No environment-specific config found for "${environment}"`);
    }
    
    // Finally, load configuration from environment variables (highest priority)
    configManager.loadFromEnvironment('EVAL_');
    
    console.log('Configuration initialized successfully');
  } catch (error) {
    console.error('Failed to initialize configuration:', error);
    throw error;
  }
}