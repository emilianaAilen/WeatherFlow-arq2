import 'dotenv/config';
import cors from 'cors';
import express, { Express, Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import { MongoDBConnection } from '@/infrastructure/database';
import { measurementRoutes, stationRoutes } from '@/user-interface/adapters';
import { generateOpenApiDocument } from '@/user-interface/swagger';
import { stationEventConsumer, measurementConsumer } from '@/infrastructure/container';
import { logger } from '@/infrastructure/logger';
import pinoHttp from 'pino-http';
import { NotFoundError, ConflictError } from '@/domain';

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
    this.app.use(pinoHttp({ logger }));
    this.app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    const swaggerDocument = generateOpenApiDocument();

    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    this.app.get('/docs.json', (_req: Request, res: Response) => res.json(swaggerDocument));

    this.app.use('/measurements', measurementRoutes);
    this.app.use('/stations', stationRoutes);

    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'OK', message: 'WeatherFlow - Alerting API is running' });
    });

    this.app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      if (err instanceof NotFoundError) {
        res.status(404).json({ message: err.message });
        return;
      }
      if (err instanceof ConflictError) {
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
      await stationEventConsumer.start();
      await measurementConsumer.start();
      this.app.listen(this.port, () => {
        logger.info({ port: this.port }, 'WeatherFlow - Alerting API is running');
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
