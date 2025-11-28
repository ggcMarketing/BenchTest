FROM node:18-alpine

WORKDIR /app

# Copy shared utilities first
COPY ./shared /shared

# Install shared dependencies
WORKDIR /shared
RUN npm install --omit=dev

# Switch back to app directory
WORKDIR /app

# Copy package files
COPY ./services/storage-engine/package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application files
COPY ./services/storage-engine .

# Create logs and data directories
RUN mkdir -p /app/logs /data/files

EXPOSE 3003

CMD ["node", "src/server.js"]
