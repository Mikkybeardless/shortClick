# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm ci

# Copy configuration and source files
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Build NestJS project
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Install build dependencies for native modules like bcrypt
RUN apk add --no-cache python3 make g++

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Rebuild bcrypt for Alpine Linux
RUN npm rebuild bcrypt --build-from-source

# Copy the built files from builder stage
COPY --from=builder /app/dist ./dist

# Give node user ownership of /app
RUN chown -R node:node /app

# Set non-root user for security
USER node

EXPOSE 8000

# NestJS default entry point
CMD ["node", "dist/main.js"]