# ✅ TODO List

---

## arthur

- [ ] display_name unique ? soit changer edit soit register
- [ ] logout -> supprimer token
- [ ] login/logout maj du status
- [ ] Affichage du status
- [ ] tout matches

## 📌 Tâches initiales

- [ ] jeu en local
- [ ] redis pour les scores
- [ ] Confirmation par mail
- [ ] Pages && components && services in frontend to clean !
- [ ] Les touches sensibles au click + Enter plus les fleches (experience user agreable)
- [ ] Create Data Models + put match to DB (how we're handling data for score, etc ? -> local variable sent with socket to front
at the end of a match -> call to database if need matchhistory)
- [ ] La cle de securite (avec quoi on genere, ou est-ce qu'on la garde)
- [ ] La gestion d'erreurs 
- [ ] Implementer les models pour les appels a la base de donnee
- [ ] POST a Artur avec les donnees du match
- [ ] httpOnly cookie for server-side ?


---

## 🔐 Sécurité & Réseau

- [ ] Ajouter des headers de sécurité dans Nginx (`X-Frame-Options`, `Content-Security-Policy`, etc.)
- [ ] Protéger les communications inter-services avec un token (ex : JWT)

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
