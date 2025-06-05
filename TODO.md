# ✅ TODO List

---

## arthur

- [x] display_name unique
- [x] logout -> supprimer token
- [x] login/logout maj du status
- [ ] confirmation par mail
- [ ] changement mdp
- [x] Affichage du status
- [ ] tout matches -> sasha ?
- [x] -> zod/back 
- [ ] -> zod/front 
- [x] La cle de securite (avec quoi on genere, ou est-ce qu'on la garde) -> cookie jwt_token
- [x] httpOnly cookie for server-side ? -> yes
- [x] grafana
- [ ] grafana/dashboards
- [ ] nettoyage

- [ ] encore des interfaces dans friendModel et voir tous type de retour plus schemas routes

## 📌 Tâches initiales

- [ ] jeu en local
- [ ] redis pour les scores
- [ ] Pages && components && services in frontend to clean !
- [ ] Les touches sensibles au click + Enter plus les fleches (experience user agreable)
- [ ] Create Data Models + put match to DB (how we're handling data for score, etc ? -> local variable sent with socket to front
at the end of a match -> call to database if need matchhistory)
- [ ] La gestion d'erreurs 
- [ ] Implementer les models pour les appels a la base de donnee
- [ ] POST a Artur avec les donnees du match
- [ ] Uniformiser les module et mduleResolution dans tsconfig.json


---

## 🔐 Sécurité & Réseau

- [ ] Ajouter des headers de sécurité dans Nginx (`X-Frame-Options`, `Content-Security-Policy`, etc.)
- [x] Protéger les communications inter-services avec un token (ex : JWT)

---

## 🧪 Tests

- [ ] Écrire des tests unitaires pour chaque microservice
- [ ] Ajouter des tests d’intégration (communication entre services)

---
Implicit conversion of a 'symbol' to a 'string' will fail at runtime. Consider wrapping this expression in 'String(...)'.ts(2731)
## 🛠️ Observabilité & DevOps

- [ ] Ajouter des logs lisibles et structurés dans chaque service
- [ ] Exposer des métriques simples (nombre de requêtes, erreurs, latence)
- [ ] Ajouter des healthchecks pour chaque microservice

---

## 📝 Documentation & outils

- [ ] Écrire une documentation claire pour le démarrage local et les contributions

---

---


## TO:DO
-> usernames cases doivent etre de la meme taille que les alises des jouers

## taches secondaires

- [ ] Les touches sensibles au click + Enter plus les fleches (experience user agreable)
- [ ] La cle de securite (avec quoi on genere, ou est-ce qu'on la garde)
- [ ] La gestion d'erreurs (voir le fichier d'Arthur)

## Custom settings
-> blind mode ()