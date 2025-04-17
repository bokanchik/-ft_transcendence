all:
	make build
	make up

build:
	docker compose -f app/docker-compose.yml build

up:
	docker compose -f app/docker-compose.yml up -d

down:
	docker compose -f app/docker-compose.yml down

ps:
	docker compose -f app/docker-compose.yml ps


clean:
	docker compose -f app/docker-compose.yml down --rmi all --volumes --remove-orphans


.PHONY : all build up down clean ps