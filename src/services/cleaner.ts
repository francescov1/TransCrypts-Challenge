import _ from 'lodash'
import { Job } from '../types'
import * as state from "./state"

/**
 * This method executes a cleaning job in state and returns the completed job.
 * 
 * @param jobId Job ID to clean
 * @returns The completed job
 */
export const performClean = (jobId: string): Job => {
  const job = state.getJob(jobId)
  // We don't want to risk updating the state itself, so clone deep
  let remainingBatches = _.cloneDeep(job.cleaningBatches)

  // Always start at room 1
  let currentRoom = 1
  let pathTaken = [currentRoom]

  let numRoomsPassedWithoutCleaning = 0

  while(remainingBatches.length > 0) {
    const nearestBatchIndex = getNearestBatchIndex(currentRoom, remainingBatches)
    const nearestBatchRooms = remainingBatches[nearestBatchIndex].allRooms
    remainingBatches.splice(nearestBatchIndex, 1)
    numRoomsPassedWithoutCleaning += getNumRoomsPassedWithoutCleaning([currentRoom, ...nearestBatchRooms])
    pathTaken.push(...nearestBatchRooms)
    currentRoom = nearestBatchRooms[nearestBatchRooms.length - 1]
  }

  const completedJob = state.completeJob(jobId, { pathTaken, numRoomsPassedWithoutCleaning });
  return completedJob
}

/**
 * This method returns the index of the nearest batch to process from a given room.
 * 
 * @param fromRoom Starting room
 * @param remainingBatches Array of remaining batches
 * @returns Index of nearest batch
 */
function getNearestBatchIndex(fromRoom: number, remainingBatches: Job['cleaningBatches']): number {
  let nearestBatchIndex = -1
  let nearestBatchDistance = Infinity

  // Simple logic here, simply check the distance from the starting room to the first room in each batch
  remainingBatches.forEach((batch, i) => {
    const batchRooms = batch.allRooms
    const distance = Math.abs(batchRooms[0] - fromRoom)
    if (distance < nearestBatchDistance) {
      nearestBatchDistance = distance
      nearestBatchIndex = i
    }
  })

  return nearestBatchIndex
}

/**
 * This method returns the number of rooms passed without cleaning when traveling from one room to another.
 * 
 * @param room1 
 * @param room2 
 * @returns The number of rooms passed 
 */
function getUncleanedRoomsBetween(room1: number, room2: number): number {
  const distance = Math.abs(room1 - room2)

  // If distance between two rooms is 0, we dont need to move. Otherwise, we need to move 1 less than the distance
  // Eg. If we have room 2 & 4, the distance is 2, but we only passed 1 room without cleaning
  return distance === 0 ? 0 : distance - 1
}

/**
 * This method returns the total number of rooms passed without cleaning for an entire batch.
 * 
 * @param batch The batch to process
 * @returns The number of rooms passed 
 */
function getNumRoomsPassedWithoutCleaning(batch: number[]) {
  let numRoomsPassed = 0
  
  for (let i = 1; i < batch.length; i++) {
    numRoomsPassed += getUncleanedRoomsBetween(batch[i], batch[i - 1])
  }
  
  return numRoomsPassed
}