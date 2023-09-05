#!/bin/bash

# Exit if any errors occur in this script
set -e

IMAGE=us-central1-docker.pkg.dev/personal-website-265105/transcrypts-challenge/docker-image
REGION=us-central1
CLOUD_RUN_INSTANCE=transcrypts-challenge

# Using the Docker tag 'latest' is considered bad practice since it does not reference a specific Docker image and is prone to breakage.
# Instead, we generate a Docker image tag based on the latest commit hash and current timestamp.
# This allows for easy debugging if you need to look back at previous images and understand which commit they correspond to.
TIMESTAMP=$(date +%Y%m%d%H%M%S)
COMMIT_HASH=$(git log -1 --pretty=%h)
TAG="${COMMIT_HASH}-${TIMESTAMP}"

docker build -t $IMAGE:$TAG .
docker tag $IMAGE:$TAG $IMAGE:latest # Add latest tag for convenience
docker push $IMAGE:$TAG

gcloud run deploy $CLOUD_RUN_INSTANCE --image $IMAGE:$TAG --region $REGION --platform managed --update-labels commit-id=$COMMIT_HASH --project personal-website-265105

# NOTE: This command is not necessary if traffic settings already route to the latest image, but it ensures that when a deployment is made we always send traffic to the new deployment.
gcloud run services update-traffic $CLOUD_RUN_INSTANCE --to-latest --region $REGION --platform managed --project personal-website-265105
