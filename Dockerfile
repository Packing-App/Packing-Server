# syntax=docker/dockerfile:1

# ---- 의존성 설치 스테이지 ----
# devDependencies를 제외하고 설치해 런타임 이미지를 가볍게 유지한다.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- 런타임 스테이지 ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# node 유저는 base 이미지에 이미 존재한다. root로 실행하지 않는다.
USER node

# Cloud Run은 PORT 환경변수를 주입한다(기본 8080).
# src/server.js가 process.env.PORT를 읽으므로 별도 처리는 불필요하다.
EXPOSE 8080

# 진입점은 src/server.js (QuoteHub는 server.js였다 — 여기서만 경로가 다르다).
CMD ["node", "src/server.js"]
