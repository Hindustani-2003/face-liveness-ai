# Use Node.js LTS image
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package config and lockfile
COPY package.json pnpm-lock.yaml tsconfig.json drizzle.config.ts vite.config.ts ./
COPY patches/ ./patches/

# Install all dependencies including devDependencies (needed for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/
COPY drizzle/ ./drizzle/

# Build the project
RUN pnpm run build

# --- Production Image ---
FROM node:20-alpine AS runner
RUN npm install -g pnpm
WORKDIR /app

# Copy built files and runtime files
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/tsconfig.json /app/drizzle.config.ts ./
COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/drizzle/ ./drizzle/
COPY --from=builder /app/patches/ ./patches/

# Install dependencies needed for runtime and migrations
RUN pnpm install --frozen-lockfile

# Set environment
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

# Run database migrations and start application
CMD ["sh", "-c", "pnpm drizzle-kit migrate || true; node dist/index.js"]
