import type { Experiment } from "../../types"
import { getDb } from "../db/getDb"

/**
 * Loads an experiment from the database
 * @param experimentName - The name of the experiment
 * @returns The experiment or undefined if it doesn't exist
 */
export const loadExperiment = async (
    experimentName: string
  ): Promise<Experiment | undefined> => {
    const db = await getDb()
    return db.data.experiments.find((e) => e.name === experimentName)
  }
  