
## 🏓 Ping Pong Game — Full-Stack Application
This is a **full-stack Ping Pong game** structured as a set of independent microservices.  

The backend is containerized with **Docker**, uses **Nginx as an API Gateway**, and offers real-time gameplay via **Socket.IO**. Monitoring is handled with **Prometheus** and **Grafana**.

## 📁 Project Structure

<details>
<summary><code>app/</code> - Main application code</summary>

```bash

├── frontend/         # Frontend client built with Tailwind CSS + TypeScript
├── gateway/          # API Gateway powered by Nginx for routing requests to services
└── services/
    ├── game/         # Core game logic and WebSocket server 
    ├── tournament/   # Tournament management service
    ├── users/        # User management service 
    ├── shared/       # Shared libraries, utilities used across services
    ├── grafana/      # Monitoring dashboard for metrics visualization
    └── prometheus/   # Metrics collection and service monitoring
```
</details>

---

## 🧱 Architecture Highlights

**Microservices**: Each service runs independently in its own container and communicates via HTTP or WebSocket.

**API Gateway**: Nginx routes client requests to the appropriate service and handles CORS, rate-limiting, etc.

**Frontend**: An UI built using TypeScript and Tailwind CSS, consuming APIs and real-time updates via Socket.IO.

**Monitoring**: Integrated observability using Prometheus and Grafana to track performance and metrics.

**Shared Logic**: The shared/ directory allows consistent types and utilities across all services.

----
## 🚀 Getting Started

### 🛠 Requirements

   🐳 **Docker** & **Docker Compose**

   🧰 **Make** installed on your system

   🔐 Ports **443** and **8443** must be available (HTTPS access)

----
### 📂 Required Files & Structure

Before launching the application, make sure the following files and directories exist at the root of the app/ directory:

```bash
app/
├── env/              # Global environment variables
secrets/            # TLS certificates and private keys
```    
----
### ▶️ Launching the Project

From the root of the app/ directory, simply run:

```bash 
make
```
This command will:

    1. 🔧 Build and start all Docker containers (gateway, services, frontend, monitoring, etc.)

    2. 🔐 Enable secure HTTPS communication on https://localhost:8443

    3. 🌐 Serve the frontend and connect it to the backend microservices

Once the stack is ready, open your browser at:

https://localhost:8443

🧪 The frontend will automatically connect to the backend services via the API Gateway.

## ⚙️ Container Management

### ⏹️ Stopping the Application

To stop all running containers associated with the project:

```bash
make down
```
(This is a standard docker-compose down)

### 🧹 Full System Cleanup (Stop & Remove Everything)

To stop all containers AND completely remove all associated data (volumes, images, networks), use the fdown command. This is useful for a clean restart.

```bash
make fdown
```
This command runs docker-compose down --rmi all -v --remove-orphans.

⚠️ Warning: This command is destructive and will permanently delete all database data. Use it when you want to reset the entire application stack.

### 🗑️ Pruning Docker System

To perform an even deeper cleanup of your Docker environment by removing all unused containers, networks, and dangling images (not just those from this project), run:

```bash
make prune
```
This helps free up disk space and keep your Docker environment tidy.
