FROM nginx:alpine

RUN apk update && apk add openssl

COPY nginx/default.conf /etc/nginx/conf.d/default.conf

COPY nginx/nginx.conf /etc/nginx/nginx.conf

COPY nginx/api_json_errors.conf /etc/nginx/

RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -out /etc/nginx/ssl/api_nginx.crt \
    -keyout /etc/nginx/ssl/api_nginx.key \
    -subj "/C=FR/ST=IDF/L=Paris/O=KingPong/OU=Dev/CN=king-pong.com"

EXPOSE 8443

CMD ["nginx", "-g", "daemon off;"]