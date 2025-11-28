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
COPY ./services/admin-api/package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application files
COPY ./services/admin-api .

# Create logs directory
RUN mkdir -p /app/logs

EXPOSE 3000

CMD ["node", "src/server.js"]
