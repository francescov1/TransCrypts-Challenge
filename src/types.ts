export interface Job {
  cleaningBatches: {
    priorityRooms: number[],
    nonPriorityRooms: number[],
    allRooms: number[]
  }[],
  createdAt: Date,
  completedAt: Date | null
  pathTaken: number[] | null
  numRoomsPassedWithoutCleaning: number | null,
  finalRoom: number | null,
  numBatches: number | null,
  numRoomsCleaned: number | null
}

export interface State {
  [jobId: string]: Job
}