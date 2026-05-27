# WeatherFlow

Monorepo containing the microservices for the WeatherFlow weather monitoring platform. Built using Hexagonal Architecture.

## Services

The platform is split into two backend microservices and a frontend UI:

1. **[Station Management](file://services/station_management):** Manages users, weather stations, and subscriptions.
   - **Port:** 4000 (internal 3000)
   - **Database:** `station_management`
   - **Swagger:** http://localhost:4000/docs
2. **[Alerting](file://services/alerting):** Receives climate measurements and publishes alerts to RabbitMQ when extreme conditions are detected.
   - **Port:** 4001 (internal 3000)
   - **Database:** `alerting`
   - **Swagger:** http://localhost:4001/docs
3. **[UI](file://ui):** React + Vite frontend for managing stations, users, and measurements.
   - **Port:** 3000
   - **App:** http://localhost:3000

## Running Locally

### With Docker Compose (Recommended)

Make sure you have Docker and Docker Compose installed.

#### Development Mode (with hot-reload)

Copy the pre-configured dev environment files for each service:

```bash
cp services/alerting/.env.example.local services/alerting/.env
cp services/station_management/.env.example.local services/station_management/.env
```

Then start the stack:

```bash
docker compose -f docker-compose.dev.yml up --build
```

#### Production Mode

```bash
docker compose up --build
```

### Without Docker

Each service and the UI can be run independently. You will need Node.js (v22+), a running MongoDB instance, and a running RabbitMQ instance.

**Backend services:**

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
3. Install dependencies and start:
   ```bash
   npm install
   npm run dev
   ```

**UI:**

1. Go to the UI directory:
   ```bash
   cd ui
   ```
2. Set environment variables in `.env`:
   ```bash
   VITE_STATION_MANAGEMENT_URL=http://localhost:4000
   VITE_ALERTING_URL=http://localhost:4001
   ```
3. Install dependencies and start:
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
├── ui/                          # React + Vite frontend
├── services/
│   ├── alerting/                # Alerting microservice
│   └── station_management/      # Station Management microservice
└── tests/
    └── e2e/                     # Cross-service End-to-End tests
```
