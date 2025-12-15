# Base image
FROM node:18-alpine

# Create app directory inside container
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy complete project
COPY . .

# App runs on 8081
EXPOSE 8081

# Start server
CMD ["node", "index.js"]
