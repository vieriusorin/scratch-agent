
import { JSONFilePreset } from 'lowdb/node';
import type { Data } from '../../types';
import { configManager } from '../config/ConfigManager';

const defaultData: Data = {
    experiments: [],
};

export const getDb = async () => {
    const dbPath = configManager.get('dbPath', 'results.json');
    const db = await JSONFilePreset<Data>(dbPath, defaultData);
    return db;
}