FROM node:24-alpine

ENV NODE_ENV=development

RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache bash && \
    rm -rf /var/cache/apk/*

SHELL ["/bin/bash", "-c"]

WORKDIR /app

# This allows Docker to cache npm install if dependencies haven't changed
COPY package.json \
     pnpm-lock.yaml \
     tsconfig.json \
     tsconfig.build.json \
     nest-cli.json \
     ./

RUN npm install --global pnpm@latest && \
    SHELL=bash pnpm setup && \
    source /root/.bashrc

ENV PNPM_HOME=/usr/local/bin

# Install all dependencies (including dev dependencies for development)
RUN pnpm install --frozen-lockfile

# Copy configuration files
COPY topic.json \
     swagger-description*.md \
     .env* \
     ./

COPY src ./src

EXPOSE 3000

# Health check for development
HEALTHCHECK --interval=60s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/v1/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))" || exit 1

CMD ["pnpm", "start:dev"]

LABEL maintainer="Landesamt für Geobasisinformation Sachsen (GeoSN) and con terra GmbH" \
      description="GeospatialAnalyzer HTTP-API Development Image" \
      environment="development"
