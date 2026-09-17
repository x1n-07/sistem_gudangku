# Stage 1: Build frontend and generate Prisma client
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source and build frontend
COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:22-alpine AS runner
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built assets and generated Prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/server ./server

# Expose port
EXPOSE 3008

# Start server
CMD ["node", "--import", "tsx", "server/index.ts"]