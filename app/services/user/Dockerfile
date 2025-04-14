FROM node:16

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . /app

EXPOSE 3001

CMD ["node", "./user_service.js"]