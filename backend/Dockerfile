# Production Dockerfile for Backend

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Swap in the PostgreSQL schema for Railway builds
RUN cp prisma/schema.railway.prisma prisma/schema.prisma

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client against the Railway/Postgres schema
RUN npx prisma generate --schema=prisma/schema.prisma

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dependencies for health checks and OpenSSL
RUN apk add --no-cache curl openssl

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD sh -c "curl -f http://localhost:${PORT:-3001}/health" || exit 1

# Start the application
CMD ["sh", "-c", "echo 'Syncing PostgreSQL schema...' && npx prisma db push --accept-data-loss --schema=prisma/schema.prisma && echo 'Schema sync complete, starting server...' && node dist/server.js"]
