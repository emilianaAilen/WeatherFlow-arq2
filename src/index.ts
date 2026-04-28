import 'dotenv/config';
import express, { Express } from 'express';
import { MongoDBConnection } from '@/infrastructure/database';
import { userRoutes, weatherStationRoutes, measurementRoutes } from '@/user-interface/adapters';

class App {
  private app: Express;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.setupMiddlewares();
    this.setupRoutes();
  }

  private setupMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    this.app.use('/users', userRoutes);
    this.app.use('/weatherStations', weatherStationRoutes);
    this.app.use('/measurements', measurementRoutes);

    this.app.get('/health', (req, res) => {
      res.json({ status: 'OK', message: 'WeatherFlow API is running' });
    });
  }

  async start(): Promise<void> {
    try {
      await MongoDBConnection.connect();
      this.app.listen(this.port, () => {
        console.log(`WeatherFlow API running on port ${this.port}`);
      });
    } catch (error) {
      console.error('Failed to start application:', error);
      process.exit(1);
    }
  }
}

const app = new App();
app.start().catch(console.error);
