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
        
</details> <details> <summary><code>./openapi/</code> - API Documentation</summary>
Houses the OpenAPI specifications for documenting and testing your REST APIs.

</details> <details> <summary><code>./test/</code> - Tests</summary>
Contains test cases for the microservices and possibly integration tests.

</details> <details> <summary><code>./node_modules/</code></summary>
Installed Node.js dependencies (automatically generated).

</details> <details> <summary><code>Makefile</code></summary>
Common commands to build, start, or manage the containers and services.

</details> <details> <summary><code>README.md</code></summary>
You're reading it!

</details> <details> <summary><code>TODO.md</code></summary>
List of tasks, bugs, or enhancements to be addressed.

</details> ```