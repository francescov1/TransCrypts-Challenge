import { Job } from '../types';

// TODO: Cleanup this func

/**
 * This method takes optimizes the order of rooms within each batch, but does not change the order of batches themselves. The order of batches is determined at execution time.
 * 
 * @param rawBatches Array of batches, each batch being an array of room numbers to clean
 * @param priorityRooms Array of priority rooms to clean first
 * @returns The optimized cleaning batches
 */
export const optimizeBatches = (rawBatches: number[][], priorityRooms: number[]): Job['cleaningBatches'] => {
  const priorityRoomsObj: { [room: number]: boolean } = {}
  priorityRooms.forEach(room => {
    priorityRoomsObj[room] = true
  })

  // This sorts rooms by ascending order, but puts priority rooms first
  const optimizedCleaningBatches = rawBatches.map(batch => {
    const uniqueBatch = [...new Set(batch)];
    let { priorityRooms, nonPriorityRooms } = uniqueBatch.reduce((acc, room) => {
      if (room in priorityRoomsObj) {
        acc.priorityRooms.push(room)
      }
      else {
        acc.nonPriorityRooms.push(room)
      }
      return acc
    }, { priorityRooms: [], nonPriorityRooms: [] } as { priorityRooms: number[], nonPriorityRooms: number[] })

    const minPriority = Math.min(...priorityRooms)
    const maxPriority = Math.max(...priorityRooms)
    const minNonPriority = Math.min(...nonPriorityRooms)
    const maxNonPriority = Math.max(...nonPriorityRooms)

    // We must traverse the list of priority rooms first, then non-priority rooms.
    // Both of these lists should be sorted so that we traverse them from one end to the other.
    // We can sort either list in ascending or descending order, as long as all priority rooms are hit first.
    // So we look at which combination of sorting results in the smallest diff between the last priority room and the 
    // first non-priority room.
    const maxToMin = Math.abs(maxPriority - minNonPriority)
    const maxToMax = Math.abs(maxPriority - maxNonPriority)
    const minToMin = Math.abs(minPriority - minNonPriority)
    const minToMax = Math.abs(minPriority - maxNonPriority)

    // TODO: See if this can be cleaned up
    if (maxToMin <= maxToMax && maxToMin <= minToMin && maxToMin <= minToMax) {
      // If max priority to min non-priority is the smallest diff, sort both in ascending order
      priorityRooms.sort((a, b) => a - b)
      nonPriorityRooms.sort((a, b) => a - b)
    }
    else if (maxToMax <= maxToMin && maxToMax <= minToMin && maxToMax <= minToMax) {
      // If max priority to max non-priority is the smallest diff, sort priority rooms in ascending order and non-priority rooms in descending order
      priorityRooms.sort((a, b) => a - b)
      nonPriorityRooms.sort((a, b) => b - a)
    }
    else if (minToMin <= maxToMin && minToMin <= maxToMax && minToMin <= minToMax) {
      // If min priority to min non-priority is the smallest diff, sort priority rooms in descending order and non-priority rooms in ascending order
      priorityRooms.sort((a, b) => b - a)
      nonPriorityRooms.sort((a, b) => a - b)
    }
    else {
      // If min priority to max non-priority is the smallest diff, sort both in descending order
      priorityRooms.sort((a, b) => b - a)
      nonPriorityRooms.sort((a, b) => b - a)
    }

    return {
      priorityRooms,
      nonPriorityRooms,
      allRooms: [...priorityRooms, ...nonPriorityRooms]
    }
  })

  return optimizedCleaningBatches;
}