FROM nginx:alpine

COPY conf/default.conf /etc/nginx/conf.d/default.conf

COPY conf/nginx.conf /etc/nginx/nginx.conf

COPY index.html /usr/share/nginx/html

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]