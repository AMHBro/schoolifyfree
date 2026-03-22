FROM oven/bun:1.2-debian

# Install necessary packages including OpenSSL 3.0.x
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json ./
COPY bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy prisma schema first
COPY prisma ./prisma

# Generate Prisma client
RUN bunx prisma generate

# Copy rest of application
COPY . .

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start command
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run start"]