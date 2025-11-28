FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application files
COPY . .

# Create logs directory
RUN mkdir -p /app/logs

EXPOSE 3000

CMD ["node", "src/server.js"]
