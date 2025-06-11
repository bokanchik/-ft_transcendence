# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: aduvilla <aduvilla@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/09/23 22:29:59 by aduvilla          #+#    #+#              #
#    Updated: 2025/06/11 15:02:53 by aduvilla         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

ENV_FILE	= app/.env

DC_FILE		= app/docker-compose.yml

SHARED_FILE	= app/services/shared/schemas

TARGET_FRONT	= app/frontend/src/shared/schemas
# TARGET_FRONT	= app/frontend/conf/shared/schemas

CREDENTIALS	= secrets/credentials.txt

all			: up


up			:
#	@grep -Fvx -f $(CREDENTIALS) $(ENV_FILE) > $(ENV_FILE).tmp || true
#	@cat $(CREDENTIALS) >> $(ENV_FILE).tmp
#	@mv $(ENV_FILE).tmp $(ENV_FILE)
#	@mkdir -p ~/data/mariadb ~/data/wordpress
	@mkdir -p $(dir $(TARGET_FRONT))
	@rm -rf $(TARGET_FRONT)
	@cp -r $(SHARED_FILE) $(TARGET_FRONT)
	docker compose -f $(DC_FILE) up -d
#	@grep -Fvx -f $(CREDENTIALS) $(ENV_FILE) > $(ENV_FILE).tmp || true
#	@mv $(ENV_FILE).tmp $(ENV_FILE)

dev			: 
	docker compose -f $(DC_FILE) up

down		:
	docker compose -f $(DC_FILE) down

re			: down up

fdown		:
#	@sudo rm -rf ~/data
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
