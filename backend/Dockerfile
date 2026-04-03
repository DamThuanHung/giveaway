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

# 👉 QUAN TRỌNG: generate Prisma trong môi trường Linux
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "run", "start:dev"]