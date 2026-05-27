# Station Management Service

Handles users and weather stations. Provides REST endpoints to register and update users, add weather stations, and manage station subscriptions.

Built with hexagonal architecture.

## Tech Stack

- **Runtime:** Node.js 18
- **Language:** TypeScript
- **Framework:** Express
- **Database:** MongoDB (via Mongoose)
- **Containerization:** Docker + Docker Compose

## Project Structure

```
├── application/                        # Use cases / application services
│   ├── UserService.ts
│   └── WeatherStationService.ts
├── domain/                             # Core business logic
│   ├── entities/
│   ├── errors/
│   └── value-objects/
├── infrastructure/                     # Driven adapters (DB)
│   ├── adapters/
│   ├── database/
│   ├── ports/
│   ├── container.ts                    # Dependency injection
│   └── types.ts
├── user-interface/                     # Driving adapters (HTTP)
│   ├── adapters/
│   ├── dtos/
│   ├── ports/
│   └── swagger/
└── index.ts                            # App entry point
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable           | Description                        | Default                  |
| ------------------ | ---------------------------------- | ------------------------ |
| `NODE_ENV`         | Environment                        | `development`            |
| `PORT`             | Port the server listens on         | `3000`                   |
| `MONGODB_URI`      | MongoDB connection string          | —                        |
| `MONGODB_DB_NAME`  | Database name                      | `station_management`     |

## Testing

Unit tests cover the domain layer (value objects and entities). Integration tests use **Testcontainers** to spin up ephemeral MongoDB and RabbitMQ instances.

```bash
npm run test               # Run Unit tests
npm run test:integration   # Run Integration tests (requires Docker)
```

## Running Locally

### Without Docker

**Prerequisites:** Node.js 18+, a running MongoDB instance.

```bash
npm install
npm run dev
```

The API will be available at `http://localhost:3000`.

### With Docker Compose

**Prerequisites:** Docker and Docker Compose.

Use the root docker-compose:

```bash
# From the project root:
docker compose up --build
```

The API will be available at `http://localhost:3000` (or the `PORT_STATIONS` defined in `.env` at the root).
