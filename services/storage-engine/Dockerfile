FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create logs and data directories
RUN mkdir -p /app/logs /data/files

EXPOSE 3003

CMD ["node", "src/server.js"]
