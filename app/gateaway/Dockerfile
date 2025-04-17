FROM alpine:3.20

RUN apk update && apk add --no-cache \
        nginx \
        openssl \
        procps

COPY conf/nginx.conf /etc/nginx/nginx.conf
COPY conf/default.conf /etc/nginx/conf.d/default.conf

COPY --chmod=0755 tools/script.sh /usr/local/bin/

EXPOSE 443

CMD ["/usr/local/bin/script.sh"]
