FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy migration files
COPY . .

CMD ["npm", "run", "migrate"]
