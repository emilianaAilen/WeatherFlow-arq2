# WeatherFlow

REST API for managing measuring stations and process climate data for later consultation by third parties, built with hexagonal architecture.

## Tech Stack

- **Runtime:** Node.js 18
- **Language:** TypeScript
- **Framework:** Express
- **Database:** MongoDB (via Mongoose)
- **Containerization:** Docker + Docker Compose

## Project Structure

```
src/
├── application/                        # Use cases / application services
│   ├── ClimateMeasurementService.ts
│   ├── UserService.ts
│   └── WeatherStationService.ts
├── domain/                             # Core business logic (no external dependencies)
│   ├── entities/
│   │   ├── ClimateMeasurement/
│   │   ├── User/
│   │   └── WeatherStation/
│   ├── errors/
│   │   └── SubscriptionError.ts
│   ├── value-objects/
│   │   ├── Alert/
│   │   ├── Humidity/
│   │   ├── Location/
│   │   ├── Pressure/
│   │   ├── SubscriptionsList/
│   │   └── Temperature/
│   └── types.ts
├── infrastructure/                     # Driven adapters (DB, external services)
│   ├── adapters/                       # Mongoose repository implementations
│   │   ├── ClimateMeasurementRepository.ts
│   │   ├── UserRepository.ts
│   │   └── WeatherStationRepository.ts
│   ├── database/
│   │   ├── schemas/                    # Mongoose schemas
│   │   └── MongoDBConnection.ts
│   ├── ports/                          # Repository interfaces
│   │   ├── IClimateMeasurementRepository.ts
│   │   ├── IUserRepository.ts
│   │   └── IWeatherStationRepository.ts
│   ├── container.ts                    # Dependency injection
│   └── types.ts
├── user-interface/                     # Driving adapters (HTTP)
│   ├── adapters/
│   │   ├── controllers/                # Express controllers
│   │   │   ├── ClimateMeasurementController.ts
│   │   │   ├── UserController.ts
│   │   │   └── WeatherStationController.ts
│   │   └── routes/                     # Express route definitions
│   │       ├── measurementRoutes.ts
│   │       ├── userRoutes.ts
│   │       └── weatherStationRoutes.ts
│   ├── dtos/                           # Request/response shapes with Zod validation
│   ├── ports/                          # Service interfaces for controllers
│   └── swagger/                        # OpenAPI docs (zod-to-openapi)
│       └── features/
│           ├── measurements/
│           ├── users/
│           └── weatherStations/
└── index.ts                            # App entry point
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable        | Description                        | Default       |
| --------------- | ---------------------------------- | ------------- |
| `NODE_ENV`      | Environment                        | `development` |
| `PORT`          | Port the server listens on         | `3000`        |
| `MONGODB_URI`   | MongoDB connection string          | —             |
| `MONGODB_DB_NAME` | Database name                    | `weatherflow` |

## Testing

Unit tests cover the domain layer (value objects and entities).

```bash
npm test
```

## Running Locally

### Without Docker

**Prerequisites:** Node.js 18+, a running MongoDB instance.

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev
```

The API will be available at `http://localhost:3000`.

### With Docker

**Prerequisites:** Docker and Docker Compose.

The Docker setup expects an external MongoDB — set `MONGODB_URI` in your `.env` file before starting.

```bash
# Build and start the container
docker compose up --build

# Run in the background
docker compose up --build -d

# Stop the container
docker compose down
```

The API will be available at `http://localhost:3000` (or the `PORT` defined in `.env`).
