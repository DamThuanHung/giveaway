# Base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build app
RUN npm run build

# 👉 generate Prisma không cần DB thật
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Expose port
EXPOSE 3800

# Start app: migrate DB rồi mới start
CMD npx prisma migrate deploy && node dist/src/main.js