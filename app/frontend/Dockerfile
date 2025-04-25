FROM node:22-alpine

WORKDIR /app

COPY conf/package*.json .

RUN npm ci

COPY conf/ .

CMD ["npm", "run", "dev"]

