FROM prom/prometheus:v3.4.0

COPY conf/prometheus.yml /etc/prometheus/prometheus.yml

# FROM debian:bullseye

# RUN apt-get update -y \
#     && apt-get install -y wget procps \
# 	&& rm -rf /var/lib/apt/lists/*

# RUN wget https://github.com/prometheus/prometheus/releases/download/v2.44.0/prometheus-2.44.0.linux-amd64.tar.gz \
#     && tar -zxvf prometheus-2.44.0.linux-amd64.tar.gz \
#     && mv prometheus-2.44.0.linux-amd64 /usr/local/prometheus \
#     && rm prometheus-2.44.0.linux-amd64.tar.gz


# COPY ./conf/prometheus.yml /usr/local/prometheus/prometheus.yml

# CMD ["/usr/local/prometheus/prometheus", "--config.file=/usr/local/prometheus/prometheus.yml"]
