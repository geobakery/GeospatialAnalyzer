# ---------- STAGE 1: Build ----------
FROM node:20 AS builder

WORKDIR /app

# Nur Abhängigkeitsdateien kopieren
COPY package.json pnpm-lock.yaml ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY topic.json ./
COPY .env ./
COPY swagger-description*.md ./

# pnpm installieren und Abhängigkeiten
RUN npm install -g pnpm && pnpm install

# Source-Code kopieren und Build starten
COPY src ./src
RUN pnpm build


# ---------- STAGE 2: Runtime ----------
FROM node:20-slim AS runtime

# Nur das Nötigste
WORKDIR /app

# Nur Runtime-Abhängigkeiten 
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/topic.json ./
COPY --from=builder /app/swagger-description*.md ./
COPY --from=builder /app/.env ./

# Start der App
CMD ["node", "dist/main.js"]
