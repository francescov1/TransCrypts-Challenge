FROM node:16-alpine as build

COPY . /app
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --quiet --no-progress

COPY . .

# Build and run
RUN npm run build
EXPOSE 8080
CMD npm run prod
