# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy shared package files
COPY ../shared/package*.json ./shared/
COPY ../shared/tsconfig.json ./shared/

# Copy source files
COPY src/ ./src/
COPY ../shared/src/ ./shared/src/

# Install dependencies
RUN npm ci
RUN cd shared && npm ci

# Build the apps
RUN cd shared && npm run build
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and built artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/shared/dist/ ./shared/dist/

# Install production dependencies only
RUN npm ci --only=production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]