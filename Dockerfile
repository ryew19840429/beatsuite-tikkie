# Use an official Node runtime as a parent image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the app (requires .env to be present for VITE_GEMINI_API_KEY)
RUN npm run build

# Install 'serve' to serve the static files
RUN npm install -g serve

# Cloud Run expects the container to listen on port 8080
ENV PORT=8080

# Serve the 'dist' directory on port 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
