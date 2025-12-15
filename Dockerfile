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

# App runs on 5000
EXPOSE 5000

# Start server
CMD ["npm", "start"]
