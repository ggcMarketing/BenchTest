FROM node:18-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application files
COPY . .

# Create logs directory
RUN mkdir -p /app/logs

EXPOSE 3002

CMD ["node", "src/server.js"]
