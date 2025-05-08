import type { Score } from 'autoevals'

export type StatisticalMetrics = {
  mean: number
  median: number
  standardDeviation: number
  confidenceInterval95: [number, number]
  min: number
  max: number
}

export type Run = {
  input: any
  output: any
  expected: any
  scores: {
    name: Score['name']
    score: Score['score']
  }[]
  error?: string
  createdAt?: string
}

export type Set = {
  runs: Run[]
  score: number
  createdAt: string
  statistics?: StatisticalMetrics
  comparisonToPrevious?: {
    pValue: number
    isSignificant: boolean
    effectSize: number
  }
}

export type Experiment = {
  name: string
  sets: Set[]
}

export type Data = {
  experiments: Experiment[]
}