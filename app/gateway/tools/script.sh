#!/bin/sh

mkdir -p /etc/nginx/ssl

sed -i "s|\$DOMAIN_NAME|$DOMAIN_NAME|g" $NGINX_CONF_FILE
sed -i "s|\$SSL_CERT|$SSL_CERT|g" $NGINX_CONF_FILE
sed -i "s|\$SSL_KEY|$SSL_KEY|g" $NGINX_CONF_FILE

# Output a self-signed cert instead of a cert request (x509) with no encryption (nodes)
if [ ! -f "$SSL_KEY" ] || [ ! -f "$SSL_CERT" ]; then
	openssl req -x509 -nodes \
		-newkey rsa:2048 \
		-keyout ${SSL_KEY} \
		-out ${SSL_CERT} \
		-subj "/C=FR/ST=IDF/L=Paris/O=KingPong/OU=Dev/CN=${DOMAIN_NAME}"
fi

exec nginx -g "daemon off;"

# nginx -t
# if [ $? -ne 0 ]; then
#     echo "Nginx configuration is invalid!"
#     exit 1
# fi
