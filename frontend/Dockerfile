# Use official Node runtime as a parent image
FROM node:20-alpine

# Set work directory
WORKDIR /app

# Install dependencies first (caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY . .

# Expose port (Vite default)
EXPOSE 5173

# Run development server by default
# Note: Host must be set to 0.0.0.0 to be accessible from outside
CMD ["npm", "run", "dev", "--", "--host"]
