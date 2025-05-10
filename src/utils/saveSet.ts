import type { Run } from "../types"
import { getDb } from "./db/getDb"
import { compareRuns } from "./evals/compareRuns"
import { calculateStatistics } from "./evals/calculateStatistics"

export const saveSet = async (
  experimentName: string,
  runs: Omit<Run, 'createdAt'>[]
) => {
  const db = await getDb()

  const runsWithTimestamp = runs.map((run) => ({
    ...run,
    createdAt: new Date().toISOString(),
  }))

  // Calculate statistics for the current set
  const statistics = calculateStatistics(runsWithTimestamp)

  // Define the type for newSet to include comparisonToPrevious
  const newSet: {
    runs: Run[];
    score: number;
    statistics: ReturnType<typeof calculateStatistics>;
    createdAt: string;
    comparisonToPrevious?: ReturnType<typeof compareRuns>;
  } = {
    runs: runsWithTimestamp,
    score: statistics.mean, // Use the mean as the overall score
    statistics,
    createdAt: new Date().toISOString(),
  }

  const existingExperiment = db.data.experiments.find(
    (e) => e.name === experimentName
  )

  if (existingExperiment && existingExperiment.sets.length > 0) {
    // Get previous set for comparison
    const previousSet = existingExperiment.sets[existingExperiment.sets.length - 1]

    // Add statistical comparison to previous set
    newSet.comparisonToPrevious = compareRuns(
      runsWithTimestamp,
      previousSet.runs
    )

    existingExperiment.sets.push(newSet)
  } else {
    // This is the first set, so no comparison needed
    db.data.experiments.push({
      name: experimentName,
      sets: [newSet],
    })
  }

  await db.write()
}