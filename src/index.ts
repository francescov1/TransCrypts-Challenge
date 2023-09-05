import express from 'express'
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import config from './config'
import * as optimizerService from './services/optimizer'
import * as state from './services/state';
import * as cleanService from './services/cleaner';
import { errorHandler } from './errors/middleware'

const app = express()

app.use(bodyParser.json());

// Route to initialize a cleaning job
app.post('/jobs', async (req, res, next) => {
  try {
    const { rawBatches, priorityRooms } = req.body
    if (!rawBatches || !priorityRooms) {
      throw new Error(`Missing required fields 'rawBatches' or 'priorityRooms'`)
    }

    const optimizedCleaningBatches = optimizerService.optimizeBatches(rawBatches, priorityRooms)
    const jobId = uuidv4()
    state.addJobToState(jobId, optimizedCleaningBatches)
    return res.json({ jobId })
  }
  catch(err) {
    return next(err)
  }
})

// Route to execute a cleaning job
app.post('/jobs/:jobId/execute', async (req, res, next) => {
  try {
    const { jobId } = req.params
    const finishedJob = cleanService.performClean(jobId)
    return res.json({ 
      jobId,
      createdAt: finishedJob.createdAt,
      completedAt: finishedJob.completedAt,
      pathTaken: finishedJob.pathTaken,
      numRoomsPassedWithoutCleaning: finishedJob.numRoomsPassedWithoutCleaning,
      finalRoom: finishedJob.finalRoom,
      numBatches: finishedJob.numBatches,
      numRoomsCleaned: finishedJob.numRoomsCleaned
     })
  }
  catch(err) {
    return next(err)
  }
})

// Mount error handling middleware
app.use(errorHandler);

// Catch all route
app.all("*", (req, res) => res.status(200).send("TransCrypts Take Home API"));

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}...`);
})