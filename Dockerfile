# Base image
FROM node:18-alpine

# Create app directory inside container
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
# Install dependencies (npm ci is faster for CI)
RUN npm ci --only=production

# Copy complete project
COPY . .

# App runs on 5000
EXPOSE 5000

# Start server
CMD ["npm", "start"]
