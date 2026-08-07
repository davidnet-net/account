# Stage 1: Build the frontend
FROM oven/bun:1 AS builder
WORKDIR /app

# Accept the GitHub token build argument
ARG GITHUB_TOKEN

# Configure npm/Bun to authenticate with GitHub Packages for your organization
RUN echo "@davidnet-net:registry=https://npm.pkg.github.com" >> ~/.npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> ~/.npmrc

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Remove the .npmrc file so the token is not cached in this image layer
RUN rm -f ~/.npmrc

COPY . .
RUN bun run build

# Stage 2: Serve the application
FROM oven/bun:1-slim
WORKDIR /app

# Copy built assets and necessary production files
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["bun", "run", "start"]