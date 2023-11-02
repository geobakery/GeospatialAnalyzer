FROM node:20

SHELL ["/bin/bash", "-c"]

WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY .env.dev ./
COPY .env ./
COPY nest-cli.json ./

RUN npm install --global pnpm \
    && SHELL=bash pnpm setup \
    && source /root/.bashrc

ENV PNPM_HOME=/usr/local/bin

COPY src /app/src
CMD [ "cd", "/app" ]
RUN pnpm install


CMD [ "pnpm", "start:dev" ]