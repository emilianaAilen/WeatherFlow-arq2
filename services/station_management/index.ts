import 'dotenv/config';
import cors from 'cors';
import express, { Express, Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import { MongoDBConnection } from '@/infrastructure/database';
import { userRoutes, weatherStationRoutes } from '@/user-interface/adapters';
import { generateOpenApiDocument } from '@/user-interface/swagger';
import { SubscriptionError } from '@/domain/errors/SubscriptionError';

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


    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'OK', message: 'WeatherFlow - Station Management API is running' });
    });

    this.app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      if (err instanceof SubscriptionError) {
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
        console.info(`WeatherFlow - Station Management API is running on port ${this.port}`);
        console.info(`Swagger UI:   http://localhost:${this.port}/docs`);
        console.info(`OpenAPI JSON: http://localhost:${this.port}/docs.json`);
      });
    } catch (error) {
      console.error('Failed to start application:', error);
      process.exit(1);
    }
  }
}

const app = new App();
export { app };

if (process.env.NODE_ENV !== 'test') {
  app.start().catch(console.error);
}
