import { JSONFilePreset } from 'lowdb/node'
import type { Data } from '../types'

const defaultData: Data = {
    experiments: [],
}

export const getDb = async () => {
    const db = await JSONFilePreset<Data>('results.json', defaultData)
    return db
}