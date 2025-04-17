# ✅ Microservices TODO List

Cette liste regroupe les tâches à accomplir pour construire l'architecture backend du projet **Ping Pong Game** en microservices, avec Nginx comme API Gateway.

---

## 📌 Tâches initiales

- [✅] Rajouter un service OpenAPI  
- [✅] Changer le HTTP pour du HTTPS  
- [ ] Bien comprendre les tâches de l’API Gateway (Nginx)  
- [ ] Comprendre comment implémenter le framework frontend  
- [ ] Regarder comment tester les APIs des microservices  
- [ ] Regarder comment fonctionne le routage avec Fastify + méthode microservice  
- [ ] Faire un routage propre même si provisoire  

---

## 🧱 Architecture et séparation des services

- [ ] Définir précisément les responsabilités de chaque microservice (ex : `user`, `game`, etc.)
- [ ] Documenter les entrées/sorties (contrats API) entre services
- [ ] Créer un dossier `shared/` si besoin pour du code commun (types, utilitaires...)

---

## 🔁 Communication entre microservices

- [ ] Tester la communication REST entre services
- [ ] Gérer les erreurs de communication (timeouts, 500, etc.)
- [ ] Ajouter un système de retry ou fallback simple en cas d’échec d’un service

---

## 🔐 Sécurité & Réseau

- [ ] Ajouter des headers de sécurité dans Nginx (`X-Frame-Options`, `Content-Security-Policy`, etc.)
- [ ] Protéger les communications inter-services avec un token (ex : JWT)

---

## 🧪 Tests

- [ ] Écrire des tests unitaires pour chaque microservice
- [ ] Ajouter des tests d’intégration (communication entre services)
- [ ] Faire un test de charge simple (ex : Artillery ou K6)

---

## 🛠️ Observabilité & DevOps

- [ ] Ajouter des logs lisibles et structurés dans chaque service
- [ ] Exposer des métriques simples (nombre de requêtes, erreurs, latence)
- [ ] Vérifier les logs de tous les containers via `docker logs` ou outil tiers
- [ ] Ajouter des healthchecks pour chaque microservice

---

## 📝 Documentation & outils

- [ ] Générer automatiquement la documentation API via OpenAPI
- [ ] Ajouter des scripts dans `Makefile` pour lancer, arrêter ou tester les services
- [ ] Écrire une documentation claire pour le démarrage local et les contributions

---

## 🌱 Pour aller plus loin (bonus)

- [ ] Gérer la configuration avec des variables d’environnement
- [ ] Automatiser les déploiements avec CI/CD (GitHub Actions ou GitLab CI)

---
