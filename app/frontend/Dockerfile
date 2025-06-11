# FROM node:22-alpine
#
# WORKDIR /app
#
# COPY conf/package*.json .
#
# RUN npm install
#
# COPY conf/ .
#
# CMD ["npm", "run", "dev"]
#

FROM node:22-alpine

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

CMD ["npm", "run", "dev"]
