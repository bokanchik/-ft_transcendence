# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: aduvilla <aduvilla@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/09/23 22:29:59 by aduvilla          #+#    #+#              #
#    Updated: 2025/07/19 13:01:45 by aduvilla         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

ENV_FILE	= app/.env

DC_FILE		= app/docker-compose.yml

SHARED_FILE	= app/services/shared/schemas

TARGET_FRONT	= app/frontend/src/shared/schemas

CREDENTIALS	= secrets/credentials.txt

all			: up

up			:
	@mkdir -p $(dir $(TARGET_FRONT))
	@rm -rf $(TARGET_FRONT)
	@cp -r $(SHARED_FILE) $(TARGET_FRONT)
	docker compose -f $(DC_FILE) up -d

dev			: 
	docker compose -f $(DC_FILE) up

down		:
	docker compose -f $(DC_FILE) down

re			: down up

fdown		:
	rm -rf $(TARGET_FRONT)
	docker compose -f $(DC_FILE) down --rmi all -v --remove-orphans

prune		: fdown
	docker system prune -a --volumes --force

logs		:
	docker compose -f $(DC_FILE) logs

restart		:
	docker compose -f $(DC_FILE) restart

stop		:
	docker compose -f $(DC_FILE) stop

ps			:
	@echo "<<< Showing processes (ps aux) in all containers >>>"
	@docker compose -f $(DC_FILE) config --services | xargs -I {} sh -c 'echo; \
	echo "--------------------------------------------------"; \
	echo "    --- Processes in Container: {} ---"; \
	echo "--------------------------------------------------"; \
	docker exec -t {} ps aux || echo "Error executing ps in {}"; \
	echo "--------------------------------------------------";'
	@echo

cert		:
	bash ./srcs/requirements/tools/copyCert.sh

.PHONY		: all up dev down fdown prune logs re stop ps
