FROM node:alpine AS build

WORKDIR /app

COPY package*.json ./

# Install node packages
RUN npm install

COPY . .

# Build the app
RUN npm run build

# Nginx to serve the frontend
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Écrase la config nginx par défaut
COPY ./nginx.conf /etc/nginx/nginx.conf

EXPOSE 8081

CMD ["nginx", "-g", "daemon off;"]