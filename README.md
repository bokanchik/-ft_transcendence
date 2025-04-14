## 📁 Project Structure

This is the directory structure of the **Ping Pong Game** full-stack application.  
The backend follows a **microservices architecture** using Docker containers, with **Nginx as an API Gateway** that routes requests to each service.

<details>
<summary><code>./app/</code> - Main application code</summary>

```bash
app/
├── docker-compose.yml         # Docker Compose configuration
├── getaway/                   # API Gateway using Nginx
│   ├── Dockerfile             # Gateway Dockerfile
│   ├── index.html             # Static landing page
│   └── nginx/                 
│       ├── default.conf       # Nginx site configuration
│       └── nginx.conf         # Main Nginx configuration
└── services/                  # Microservices
    ├── game/                  # Game service
    │   ├── Dockerfile
    │   ├── game_service.js
    │   ├── package.json
    │   └── package-lock.json
    └── user/                  # User service
        ├── Dockerfile
        ├── user_service.js
        ├── package.json
        └── package-lock.json
