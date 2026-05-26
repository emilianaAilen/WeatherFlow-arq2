# WeatherFlow

Monorepo containing the microservices for the WeatherFlow weather monitoring platform. Built using Hexagonal Architecture.

## Architecture

For an in-depth explanation of why the system is split into multiple microservices and the responsibility of each component, please read our **[Architecture Decisions Document](file://docs/architecture.md)**.

## Services

The platform is split into two independent services:

1. **[Station Management](file://services/station_management):** Responsible for managing users, weather stations, and subscriptions.
   - **Port:** 4000 (Internal 3000)
   - **Database:** `station_management`
   - **Swagger Documentation:** http://localhost:4000/docs
2. **[Alerting](file://services/alerting):** Responsible for receiving climate measurements and publishing alerts to RabbitMQ when extreme conditions are met.
   - **Port:** 4001 (Internal 3000)
   - **Database:** `alerting`
   - **Swagger Documentation:** http://localhost:4001/docs

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

## Testing

The project uses Jest for all testing layers, from Unit to End-to-End.

### Unit & Integration Tests (Testcontainers)
Each microservice has its own test suite. We use **Testcontainers** to spin up ephemeral MongoDB and RabbitMQ Docker instances automatically when running integration tests.
Make sure your Docker daemon is running before executing these.

```bash
cd services/station_management # or services/alerting
npm run test               # Unit tests
npm run test:integration   # Integration tests with Testcontainers
```

### End-to-End (E2E) Tests
E2E tests validate the complete flow between both services (e.g. creating a station, sending an extreme measurement, and triggering a RabbitMQ alert).
We use a dedicated, isolated environment to avoid polluting development data.

To run the full E2E pipeline, just execute the provided script at the root of the project:
```bash
./run-e2e.sh
```
This script will:
1. Spin up the isolated `docker-compose.e2e.yml` environment.
2. Wait dynamically for the services to be ready.
3. Execute the tests located in `tests/e2e/`.
4. Tear down the environment and wipe the temporary database automatically.

## Repository Structure

```text
.
├── docker-compose.dev.yml       # Docker compose for development
├── docker-compose.yml           # Docker compose for production
├── docker-compose.e2e.yml       # Ephemeral Docker compose for E2E tests
├── run-e2e.sh                   # Automation script for E2E pipeline
├── services/
│   ├── alerting/                # Alerting service code
│   └── station_management/      # Station Management service code
└── tests/
    └── e2e/                     # Cross-service End-to-End tests
```
