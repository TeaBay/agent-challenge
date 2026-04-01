# syntax=docker/dockerfile:1

# --- Stage 1: Build frontend ---
FROM node:23-slim AS frontend-build
RUN npm install -g pnpm
WORKDIR /frontend
COPY frontend/package.json frontend/pnpm-lock.yaml* ./
RUN pnpm install
COPY frontend/ .
RUN pnpm build

# --- Stage 2: Production ---
FROM node:23-slim AS base

RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  git \
  && rm -rf /var/lib/apt/lists/*

ENV ELIZAOS_TELEMETRY_DISABLED=true
ENV DO_NOT_TRACK=1

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./
RUN pnpm install

COPY . .

# Copy built frontend into static serve directory
COPY --from=frontend-build /frontend/dist ./frontend/dist

RUN mkdir -p /app/data

EXPOSE 3000 5173

ENV NODE_ENV=production
ENV SERVER_PORT=3000

CMD ["pnpm", "start"]
