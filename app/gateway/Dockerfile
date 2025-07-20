FROM alpine:3.20

RUN apk update && apk add --no-cache \
        nginx \
        openssl \
        procps

COPY conf/nginx.conf /etc/nginx/nginx.conf
COPY conf/default.conf /etc/nginx/conf.d/default.conf
COPY conf/api_json_errors.conf /etc/nginx/api_json_errors.conf

#COPY index.html /usr/share/nginx/html/index.html

COPY --chmod=0755 tools/script.sh /usr/local/bin/

EXPOSE 8443

CMD ["/usr/local/bin/script.sh"]
