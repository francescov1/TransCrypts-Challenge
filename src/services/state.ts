import { State, Job } from '../types'

let state: State = {}

/**
 * Fetch a job from state
 * 
 * @param jobId
 * @returns The job
 */
export const getJob = (jobId: string) => {
  if (!state[jobId]) {
    throw new Error(`Job with id ${jobId} not found`)
  }

  return state[jobId]
}

/**
 * Add a job to state
 * @param jobId 
 * @param cleaningBatches The optimized cleaning batches
 */
export const addJobToState = (jobId: string, cleaningBatches: Job['cleaningBatches']) => {
  state[jobId] = {
    cleaningBatches,
    createdAt: new Date(),
    completedAt: null,
    pathTaken: null,
    numRoomsPassedWithoutCleaning: null,
    get finalRoom() {
      if (this.pathTaken === null) return null
      return this.pathTaken[this.pathTaken.length - 1]
    },
    get numBatches() {
      return this.cleaningBatches.length
    },
    get numRoomsCleaned() {
      if (this.pathTaken === null) return null
      return this.pathTaken.length
    }
  }
}

/**
 * Set completion parameters for a given job
 * @param jobId 
 * @param completionDetails The pathTaken and numRoomsPassedWithoutCleaning values for the completed job
 * @returns 
 */
export const completeJob = (jobId: string, { pathTaken, numRoomsPassedWithoutCleaning }: { pathTaken: number[], numRoomsPassedWithoutCleaning: number }) => {
  if (!state[jobId]) {
    throw new Error(`Job with id ${jobId} not found`)
  }

  state[jobId].pathTaken = pathTaken
  state[jobId].completedAt = new Date()
  state[jobId].numRoomsPassedWithoutCleaning = numRoomsPassedWithoutCleaning
  return state[jobId]
}
