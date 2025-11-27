FROM node:18-alpine

WORKDIR /app

# Install build dependencies for native modules and wget for healthcheck
RUN apk add --no-cache python3 make g++ wget

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["node", "server.js"]
