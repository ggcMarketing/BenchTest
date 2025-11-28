FROM node:18-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy shared utilities first
COPY ./shared /shared

# Install shared dependencies
WORKDIR /shared
RUN npm install --omit=dev

# Switch back to app directory
WORKDIR /app

# Copy package files
COPY ./services/collector/package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application files (excluding node_modules)
COPY ./services/collector/src ./src
COPY ./services/collector/Dockerfile ./Dockerfile

# Create logs directory
RUN mkdir -p /app/logs

EXPOSE 3002

CMD ["node", "src/server.js"]
