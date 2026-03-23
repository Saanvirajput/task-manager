FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install --production=false

# Copy backend source
COPY backend/ ./

# Generate Prisma client (no DB connection needed)
RUN npx prisma generate

# Build TypeScript
RUN npx tsc

# Expose port
EXPOSE 5000

# Start
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run start"]
