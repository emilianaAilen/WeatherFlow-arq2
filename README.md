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
├── domain/
│   ├── entities/           # Core business objects (User, WeatherStation, ClimateMeasurement)
│   ├── value-objects/      # Immutable domain types (Temperature, Humidity, Pressure, Location, Alert, SubscriptionsList)
│   └── types.ts            # Shared domain types
├── infrastructure/
│   └── database/
│       ├── schemas/        # Mongoose schemas
│       └── MongoDBConnection.ts
└── user-interface/
    └── adapters/
        └── routes/         # Express route handlers (users, weatherStations, measurements)
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

# Start in development mode (with hot reload via ts-node)
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
