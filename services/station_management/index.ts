import 'dotenv/config';
import '@/infrastructure/telemetry/tracing';
import { randomUUID } from 'crypto';
import cors from 'cors';
import express, { Express, Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import { MongoDBConnection } from '@/infrastructure/database';
import { userRoutes, weatherStationRoutes } from '@/user-interface/adapters';
import { generateOpenApiDocument } from '@/user-interface/swagger';
import { SubscriptionError } from '@/domain/errors/SubscriptionError';
import { NotFoundError, ConflictError } from '@/domain';
import { logger } from '@/infrastructure/logger';
import pinoHttp from 'pino-http';
import { register } from '@/infrastructure/telemetry/metrics';
import { metricsMiddleware } from '@/infrastructure/telemetry/metricsMiddleware';

class App {
  private app: Express;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.setupMiddlewares();
    this.setupRoutes();
  }

  public getExpressApp(): Express {
    return this.app;
  }

  private setupMiddlewares(): void {
    this.app.use(
      pinoHttp({
        logger,
        genReqId: (req) => (req.headers['x-request-id'] as string) ?? randomUUID(),
        autoLogging: { ignore: (req) => req.url === '/health' },
      }),
    );
    this.app.use(metricsMiddleware);
    this.app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    const swaggerDocument = generateOpenApiDocument();

    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    this.app.get('/docs.json', (_req: Request, res: Response) => res.json(swaggerDocument));

    this.app.use('/users', userRoutes);
    this.app.use('/weatherStations', weatherStationRoutes);

    this.app.get('/metrics', async (_req: Request, res: Response) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });

    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'OK', message: 'WeatherFlow - Station Management API is running' });
    });

    this.app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      if (err instanceof NotFoundError) {
        res.status(404).json({ message: err.message });
        return;
      }
      if (err instanceof ConflictError || err instanceof SubscriptionError) {
        res.status(409).json({ message: err.message });
        return;
      }
      const status: number = err.statusCode || err.status || 500;
      res.status(status).json({ message: err.message || 'Internal Server Error' });
    });
  }

  async start(): Promise<void> {
    try {
      await MongoDBConnection.connect();
      this.app.listen(this.port, () => {
        logger.info({ port: this.port }, 'WeatherFlow - Station Management API is running');
        logger.info({ url: `http://localhost:${this.port}/docs` }, 'Swagger UI');
      });
    } catch (error) {
      logger.error({ error }, 'Failed to start application');
      process.exit(1);
    }
  }
}

const app = new App();
export { app };

if (process.env.NODE_ENV !== 'test') {
  app.start().catch(console.error);
}
