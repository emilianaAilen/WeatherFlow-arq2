# Ingesting Service

Manages which weather stations receive external data ingestion. Listens to station lifecycle events from the `station-events` fanout exchange and, based on the `receivesExternalData` flag set at station creation or update, maintains a local registry of monitored stations. These records store the data needed to create climate measurements via the Alerting API.

Built with hexagonal architecture.

## Tech Stack

- **Runtime:** Node.js 22
- **Language:** TypeScript
- **Framework:** Express
- **Database:** MongoDB (via Mongoose)
- **Message broker:** RabbitMQ (via amqplib)
- **Containerization:** Docker + Docker Compose

## Project Structure

```
├── application/                        # Use cases / application services
│   └── MonitoredStationService.ts
├── domain/                             # Core business logic
│   ├── entities/
│   │   └── MonitoredStation/
│   └── errors/
│       └── DomainErrors.ts
├── infrastructure/                     # Driven adapters (DB, MQ, external)
│   ├── adapters/
│   │   ├── IngestionScheduler.ts       # node-cron scheduler for OWM fetch cycles
│   │   ├── MonitoredStationRepository.ts
│   │   ├── OWMHttpClient.ts            # OpenWeatherMap HTTP adapter with fault tolerance
│   │   ├── RabbitMQMeasurementPublisher.ts
│   │   └── RabbitMQStationEventConsumer.ts
│   ├── database/
│   │   ├── MongoDBConnection.ts
│   │   └── schemas/
│   │       └── MonitoredStationSchema.ts
│   ├── fault-tolerance/
│   │   └── CircuitBreaker.ts           # Custom circuit breaker for OWM HTTP calls
│   ├── ports/
│   │   └── IMonitoredStationRepository.ts
│   ├── telemetry/
│   │   ├── amqpPropagation.ts          # W3C trace context inject/extract for RabbitMQ
│   │   ├── metrics.ts                  # prom-client registry and counters
│   │   ├── metricsMiddleware.ts        # Express middleware for HTTP duration histogram
│   │   └── tracing.ts                  # OpenTelemetry SDK initialization
│   └── container.ts                    # Dependency injection
├── user-interface/                     # Driving adapters (HTTP)
│   ├── adapters/
│   │   ├── controllers/
│   │   │   └── MonitoredStationController.ts
│   │   └── routes/
│   │       └── monitoredStationRoutes.ts
│   ├── ports/
│   │   └── MonitoredStationPort.ts
│   └── swagger/
│       ├── features/
│       │   └── monitoredStations/
│       └── shared/
└── index.ts                            # App entry point
```

## Environment Variables

| Variable                       | Description                                     | Default / Example                                                       |
| ------------------------------ | ----------------------------------------------- | ----------------------------------------------------------------------- |
| `NODE_ENV`                     | Runtime environment                             | `development`                                                           |
| `PORT`                         | HTTP port the service listens on                | `3000`                                                                  |
| `MONGODB_URI`                  | MongoDB connection string                       | `mongodb://admin:secret@localhost:27017/ingesting?authSource=admin`     |
| `RABBITMQ_URL`                 | RabbitMQ AMQP URL                               | `amqp://localhost`                                                      |
| `CORS_ORIGIN`                  | Allowed CORS origin                             | `http://localhost:3000`                                                 |
| `OWM_API_KEY`                  | OpenWeatherMap API key                          | —                                                                       |
| `OWM_CRON`                     | Cron expression for ingestion cycle             | `*/5 * * * *`                                                           |
| `OWM_BASE_URL`                 | OpenWeatherMap base URL                         | `https://api.openweathermap.org/data/2.5`                               |
| `OWM_TIMEOUT_MS`               | OWM request timeout in milliseconds             | `5000`                                                                  |
| `OTEL_SERVICE_NAME`            | Service name reported to Tempo                  | `ingesting`                                                             |
| `OTEL_EXPORTER_OTLP_ENDPOINT`  | OTLP endpoint for traces (Tempo)                | `http://localhost:4318`                                                 |

Copy `.env.example` to `.env` and fill in your values.

## Running Locally

### With Docker Compose (recommended)

**Production mode:**
```bash
docker compose up ingesting
```

**Development mode (hot reload):**
```bash
docker compose -f docker-compose.dev.yml up ingesting
```

### Without Docker

```bash
npm install
cp .env.example .env   # then edit .env
npm run dev            # hot reload via tsx
```

**Build & run compiled output:**
```bash
npm run build
npm start
```

## API

Once running, the Swagger UI is available at:

- `http://localhost:4002/docs` (via Docker Compose default port)
- `http://localhost:3000/docs` (direct process)

### Endpoints

| Method | Path                        | Description                              |
| ------ | --------------------------- | ---------------------------------------- |
| GET    | `/monitored-stations`       | List all stations registered for ingestion |
| GET    | `/monitored-stations/:id`   | Get a single monitored station by UUID   |
| GET    | `/metrics`                  | Prometheus metrics (prom-client)         |
| GET    | `/health`                   | Health check                             |

## Event Consumption

The service consumes from the `station-events` fanout exchange via its own dedicated queue `ingesting.station-events`.

| Event            | `receivesExternalData` | Action                              |
| ---------------- | ---------------------- | ----------------------------------- |
| `StationCreated` | `true`                 | Register station for ingestion      |
| `StationCreated` | `false` / absent       | Ignore                              |
| `StationUpdated` | `true`                 | Upsert station in monitored registry |
| `StationUpdated` | `false`                | Remove station from monitored registry (if present) |
| `StationDeleted` | —                      | Remove station from monitored registry (if present) |

## Testing

```bash
npm test                    # unit tests
npm run test:integration    # integration tests (requires Docker)
```
