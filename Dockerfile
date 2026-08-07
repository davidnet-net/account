# Stage 1: Build the frontend
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Stage 2: Serve the application
FROM oven/bun:1-slim
WORKDIR /app

# Copy built assets and necessary production files
# Adjust paths depending on whether you are using static export or a SvelteKit adapter
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["bun", "run", "start"]