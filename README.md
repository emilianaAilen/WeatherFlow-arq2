# WeatherFlow

Monorepo containing the microservices for the WeatherFlow weather monitoring platform. Built using Hexagonal Architecture.

## Services

The platform is split into two independent services:

1. **[Station Management](file://services/station_management):** Responsible for managing users, weather stations, and subscriptions.
   - **Port:** 3000
   - **Database:** `station_management`
   - **Swagger Documentation:** http://localhost:3000/docs
2. **[Alerting](file://services/alerting):** Responsible for receiving climate measurements and publishing alerts to RabbitMQ when extreme conditions are met.
   - **Port:** 3001
   - **Database:** `alerting`
   - **Swagger Documentation:** http://localhost:3001/docs

## Running Locally

### With Docker Compose (Recommended)

Make sure you have Docker and Docker Compose installed.

#### Development Mode (with hot-reload)

```bash
docker compose -f docker-compose.dev.yml up --build
```

#### Production Mode

```bash
docker compose up --build
```

### Without Docker

Each service can be run independently. You will need Node.js (v18+), a running MongoDB instance, and a running RabbitMQ instance.

1. Go to the service directory:
   ```bash
   cd services/station_management
   # or
   cd services/alerting
   ```
2. Copy `.env.example` to `.env` and fill in the values:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies and start the service in development mode:
   ```bash
   npm install
   npm run dev
   ```

## Repository Structure

```
.
├── docker-compose.dev.yml       # Docker compose for development
├── docker-compose.yml           # Docker compose for production
└── services/
    ├── alerting/                # Alerting service code
    └── station_management/      # Station Management service code
```
