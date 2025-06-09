FROM node:22-slim

WORKDIR /app

COPY conf/package*.json .

RUN npm install

COPY conf/ .

CMD ["npm", "run", "dev"]

