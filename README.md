

## Project Structure
.
├── assets/        # Images, fonts, and other static assets for the frontend
├── backend/       # Backend source code for the application
│   └── src/       # Core backend source code
│       ├── config/  # Configuration files (e.g., environment settings)
│       ├── controllers/  # Controllers handling the backend logic
│       ├── models/  # Database models (if applicable)
│       ├── routes/  # API routes and endpoints
│       ├── services/  # Business logic, including game and user services
│       │   ├── game/  # Game-specific services
│       │   └── user/  # User-related services
│       └── utils/    # Utility functions used throughout the backend
├── config/        # Additional configuration files for the project (e.g., Docker settings)
├── data/          # Text-based data in JSON format (e.g., mock data, static files)
├── frontend/      # Frontend source code for the application
│   └── src/       # Core frontend source code
│       ├── assets/  # Static assets like images, fonts, and icons
│       │   ├── images/  # Image files used in the UI
│       │   └── fonts/   # Font files used in the frontend
│       ├── components/  # Reusable UI components (e.g., buttons, cards)
│       ├── pages/       # Views or pages of the app (e.g., Home, Game, Scoreboard)
│       ├── services/    # Frontend services, API calls, state management
│       └── utils/       # Utility functions for the frontend
├── tests/         # Test files for backend and frontend code
│   ├── backend/    # Tests for backend logic (API, controllers, services)
│   └── frontend/   # Tests for frontend components and pages
├── docker/        # Docker-related files for containerization
│   ├── docker-compose.yml  # Docker Compose configuration to run frontend and backend together
│   ├── Dockerfile.backend   # Dockerfile for building the backend container
│   └── Dockerfile.frontend  # Dockerfile for building the frontend container
├── .env           # Environment variables for configuration (not committed to version control)
├── .gitignore     # Specifies files and directories to ignore in git version control
├── Makefile       # Commands for building, running, or managing the project
├── README.md      # Project documentation (you're reading it!)
└── .git/          # Git repository data (automatically created by git)
