# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv
ARG NODE_VERSION=20.11.0

# Base image
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
COPY package-lock.json package.json ./

# Build stage
FROM base AS build
# Install dev node modules
RUN npm ci --include=dev
# Build application
COPY ./app /app/app
COPY ./public /app/public
COPY ./server.js ./tsconfig.json ./vite.config.ts /app/
RUN npm run build

# Final stage for app image
FROM base AS prod
ENV NODE_ENV="production"
# Install production node modules
# Install distribution specific sharp module
# Remove dev and optional modules
RUN npm ci --omit=dev && npm install @img/sharp-linuxmusl-x64 @img/sharp-libvips-linuxmusl-x64 && npm prune --omit=dev --omit=optional && npm cache clean --force 

# Copy built application and server files
COPY --from=build /app/build /app/build
COPY --from=build /app/server.js /app/

# Start the server
EXPOSE 3000
CMD [ "node", "./server.js" ]