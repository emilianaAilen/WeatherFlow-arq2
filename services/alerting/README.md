# Alerting Service

Handles climate alerts and notifications. When a climate measurement is created or updated and its values trigger an alert condition, this service publishes the event to a RabbitMQ queue (`climate-alerts`) for downstream consumers.

Built with hexagonal architecture.

## Tech Stack

- **Runtime:** Node.js 18
- **Language:** TypeScript
- **Framework:** Express
- **Database:** MongoDB (via Mongoose)
- **Message broker:** RabbitMQ (via amqplib)
- **Containerization:** Docker + Docker Compose

## Project Structure

```
├── application/                        # Use cases / application services
│   └── ClimateMeasurementService.ts
├── domain/                             # Core business logic
│   ├── entities/
│   │   └── ClimateMeasurement/
│   ├── value-objects/
│   │   ├── Alert/
│   │   ├── Humidity/
│   │   ├── Location/
│   │   ├── Pressure/
│   │   └── Temperature/
│   └── types.ts
├── infrastructure/                     # Driven adapters (DB, MQ)
│   ├── adapters/
│   │   ├── ClimateMeasurementRepository.ts
│   │   ├── RabbitMQMeasurementConsumer.ts
│   │   ├── RabbitMQNotificationQueue.ts
│   │   ├── RabbitMQStationEventConsumer.ts
│   │   └── StationReadModelRepository.ts
│   ├── database/
│   │   ├── MongoDBConnection.ts
│   │   └── schemas/
│   ├── ports/
│   │   ├── IClimateMeasurementRepository.ts
│   │   ├── INotificationQueue.ts
│   │   └── IStationReadModelRepository.ts
│   ├── telemetry/
│   │   ├── amqpPropagation.ts          # W3C trace context inject/extract for RabbitMQ
│   │   ├── metrics.ts                  # prom-client registry and counters
│   │   ├── metricsMiddleware.ts        # Express middleware for HTTP duration histogram
│   │   └── tracing.ts                  # OpenTelemetry SDK initialization
│   ├── container.ts                    # Dependency injection
│   └── types.ts
├── user-interface/                     # Driving adapters (HTTP)
│   ├── adapters/
│   │   ├── controllers/
│   │   └── routes/
│   ├── dtos/
│   ├── ports/
│   └── swagger/
│       ├── features/
│       └── shared/
├── tests/
│   └── integration/
└── index.ts                            # App entry point
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable                       | Description                              | Default                  |
| ------------------------------ | ---------------------------------------- | ------------------------ |
| `NODE_ENV`                     | Environment                              | `development`            |
| `PORT`                         | Port the server listens on               | `3000`                   |
| `MONGODB_URI`                  | MongoDB connection string                | —                        |
| `MONGODB_DB_NAME`              | Database name                            | `alerting`               |
| `RABBITMQ_URL`                 | RabbitMQ connection string               | `amqp://localhost`       |
| `CORS_ORIGIN`                  | Allowed CORS origin                      | `http://localhost:3000`  |
| `OTEL_SERVICE_NAME`            | Service name reported to Tempo           | `alerting`               |
| `OTEL_EXPORTER_OTLP_ENDPOINT`  | OTLP endpoint for traces (Tempo)         | `http://localhost:4318`  |

## Running RabbitMQ

The service publishes to the `climate-alerts` queue. You need a running RabbitMQ instance before starting the app. Pick whichever option fits your setup.

### Option 1 — Local Docker container

Spin up a standalone RabbitMQ container with the management UI on port 15672:

```bash
docker run -d \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

Set in `.env`:

```env
RABBITMQ_URL=amqp://localhost
```

Management UI: http://localhost:15672 (guest / guest)

### Option 2 — Docker Compose (alongside the app)

The included `docker-compose.yml` starts RabbitMQ together with the app. No separate steps needed — just bring Compose up and the `RABBITMQ_URL` is wired automatically:

```bash
docker compose up --build
```

The app waits for RabbitMQ to pass its healthcheck before starting. The resulting URL (already set as the Compose default) is:

```env
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
```

Management UI: http://localhost:15672 (guest / guest)

### Option 3 — CloudAMQP free cloud instance

1. Create a free account at https://www.cloudamqp.com
2. Open the instance dashboard and copy the **AMQP URL**.

Set in `.env`:

```env
RABBITMQ_URL=amqps://user:password@your-instance.cloudamqp.com/vhost
```

No local broker needed — the app connects to the cloud instance directly.

## Testing

Unit tests cover the domain layer (value objects and entities). Integration tests use **Testcontainers** to spin up ephemeral MongoDB and RabbitMQ instances.

```bash
npm run test               # Run Unit tests
npm run test:integration   # Run Integration tests (requires Docker)
```

## Running Locally

### Without Docker

**Prerequisites:** Node.js 18+, a running MongoDB instance, and a running RabbitMQ instance (see above).

```bash
npm install
npm run dev
```

The API will be available at `http://localhost:3000`.

### With Docker Compose

**Prerequisites:** Docker and Docker Compose.

```bash
# Build and start the app + RabbitMQ
docker compose up --build

# Run in the background
docker compose up --build -d

# Stop everything
docker compose down
```

The API will be available at `http://localhost:3001` (or the `PORT_ALERTING` defined in `.env`).

Additional endpoints:

| Path       | Description                              |
| ---------- | ---------------------------------------- |
| `/metrics` | Prometheus metrics (prom-client)         |
| `/health`  | Health check                             |
| `/docs`    | Swagger UI                               |
