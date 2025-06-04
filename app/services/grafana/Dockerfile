FROM grafana/grafana:10.1.1

COPY provisioning/ /etc/grafana/provisioning/

# FROM debian:bullseye

# RUN apt-get update -y \
#     && apt-get install -y wget adduser libfontconfig1 procps sqlite3\
# 	&& rm -rf /var/lib/apt/lists/*

# RUN wget https://dl.grafana.com/oss/release/grafana-8.5.5.linux-amd64.tar.gz \
#     && tar -zxvf grafana-8.5.5.linux-amd64.tar.gz \
#     && mv grafana-8.5.5 /usr/share/grafana \
#     && rm grafana-8.5.5.linux-amd64.tar.gz

# COPY ./conf/prometheus.yml /usr/share/grafana/conf/provisioning/datasources/prometheus.yml

# COPY --chmod=0755 ./tools/script.sh /usr/local/bin/

# CMD ["/usr/local/bin/script.sh"]
