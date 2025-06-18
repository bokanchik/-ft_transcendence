FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 6001

# CMD ["npm", "run", "start"]
CMD ["npm", "run", "start:tsx"]
