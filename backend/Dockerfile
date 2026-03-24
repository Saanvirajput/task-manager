FROM node:18-slim AS builder

WORKDIR /app

# Install openssl for prisma
RUN apt-get update -y && apt-get install -y openssl

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source and prisma
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-slim

WORKDIR /app

# Install openssl for prisma runtime
RUN apt-get update -y && apt-get install -y openssl

# Copy from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 5000

# Start command
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
