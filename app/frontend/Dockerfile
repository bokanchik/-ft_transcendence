FROM node:22-alpine

WORKDIR /app

COPY conf/package*.json .

RUN npm install

COPY conf/ .

CMD ["npm", "run", "dev"]

