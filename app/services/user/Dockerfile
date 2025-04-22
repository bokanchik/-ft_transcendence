FROM node:alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . /app

EXPOSE 3003

CMD ["node", "./user_service.js"]