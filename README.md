# TransCrypts Take Home Challenge

## How to use

The service is hosted at https://transcrypts-challenge-jggtxw64pq-uc.a.run.app on a GCP Cloud Run instance. You can also run it locally by installing dependencies `npm install` and starting with `npm start`.

There are two main endpoints:

### `POST /jobs` 

Create a cleaning job. This route optimizes the room order and saves them to state.
- Params:
   - `rawBatches`: [[int]]
   - `priorityRooms`: [int]
- Returns: 
   - `jobId`: string
- Example request:
```json
{
   "rawBatches": [[3,2,4], [1,8,4], [4,6,4,9], [2,7,8,9,3]],
   "priorityRooms": [1,4]
}
```

- Example response:
```json
{
   "jobId": "12532e8e-03c6-4492-a09a-0ebed61ff9d1"
}
```

### `POST /jobs/:jobId/execute` 

Executes a given cleaning job. 
- Params:
   - `jobId`: string
- Returns: 
   - `jobId`: string
   - `createdAt`: Date
   - `completedAt`: Date
   - `pathTaken`: [int]
   - `numRoomsPassedWithoutCleaning`: int
   - `finalRoom`: int
   - `numBatches`: int
   - `numRoomsCleaned`: int

- Example request:
```json
{
   "jobId": "12532e8e-03c6-4492-a09a-0ebed61ff9d1"
}
```

- Example response:
```json
{
   "jobId": "12532e8e-03c6-4492-a09a-0ebed61ff9d1",
    "createdAt": "2023-09-05T02:02:48.000Z",
    "completedAt": "2023-09-05T02:02:56.530Z",
    "pathTaken": [1,1,4,8,4,3,2,2,3,7,8,9,4,6,9],
    "numRoomsPassedWithoutCleaning": 18,
    "finalRoom": 9,
    "numBatches": 4,
    "numRoomsCleaned": 15
}
```

## Architecture
- To mimic a microservice architecture, I split up the application into 3 main services:
   - State: responsible for keeping track of the current cleaning jobs. Essentially the database of the application.
   - Optimizer: responsible for optimizing the order of rooms within a batch, and the order of batches.
   - Cleaner: responsible for doing the cleaning. Traverses through the rooms, keeps track of metrics and saves them to state.
- We could have made each of these into their own microservice, but this felt like overkill for the purpose of this small application. At the end I explain how this could've been achieved.

## Strategy Explanation
- The strategy here is to first optimize the order of rooms within each batch, then optimize the order of batches.
- We remove duplicates within each batch, since there shouldn't be any reason to clean the same room twice.
- This strategy is not the most optimal strategy, but for the purpose of this exercise it works quite well for a few reasons:
   - The way to clean a batch with least number of uncleaned rooms is to sort the rooms in order, then start from one end and go to the other end. This way, we don't need to traverse an uncleaned room more than once. Since the robot likely won't already be at the end of a batch, we want to start from the end which is closest to the current room, thus limiting the amount of travel before starting the sequence.
   - With priority rooms this gets a bit complicated since we need to hit those first. So we can split each batch into two sub-batches: priority rooms and non-priority rooms.
   - Now using the same strategy as above, we first traverse the priority rooms from one end to the other, then we traverse the non-priority rooms from one end to the other.
   - Both sub-batches can be traversed in either ascending or descending order. So we essentially have 4 possible permutations: ascending priority & ascending non-priority, ascending priority & descending non-priority, descending priority & ascending non-priority, descending priority & descending non-priority. We chose the permutation which results in the shortest travel between the last priority room and the first non-priority room, since this limits the number of uncleaned rooms to pass when combining the two sub-batches.
   - Once we finish a batch, we look through the list of remaining batches and find the nearest one to the current position, and clean that one next.

## Drawbacks & Opportunities

The main area of improvement is related to the algorithm used. The drawbacks of this strategy are:
- Optimizing single batches first, then the order of batches leaves out opportunity for further optimization. We should optimize across the entire set of rooms & batches for best results (e.g. there may be cases where it is better to take a longer route within a batch if it results in a smaller route to arrive at the next batch).
- The ordering of batches is also not optimal. Although looking for the nearest batch is a decent strategy to chose the next batch to clean, there may be cases where going to a further batch is more optimal since it results in shorter overall distances to travel later.

There's lots of variables involved, so it would require a complex algorithm to be able to optimize across the entire space of variables. A variation of Dijsktra's Algorithm or a Traveling Salesman Problem algorithm could be used.

I should also mention that the brute force solution is likely pretty effective as well, and within small boundary conditions would not be too slow. The idea here is to still use the system of sub-batches with priority & non-priority rooms, but to explore the entire space of combintations to find the most optimal (ie try all combintations of ascending and descending order sub-batches, and all combinations of order of batches). We could add memoization to this strategy to improve its efficiency.

A few other small improvements that should be made
- Remove duplicates across all batches, since there's likely no need to clean the same room twice.
- Unit testing service methods would be nice, although for the purpose of this challenge its unnecessary.
- We could have split each service into a proper microservice, and used a job queue to keep track of jobs. Rather than giving an API endpoint to each service, we could use a job/message queue like [BullMQ](https://docs.bullmq.io/) with Redis to create & process jobs between the main API endpoint and the Cleaner & Optimizer service. The State service wouldn't be necessary since BullMQ would handle its job.