import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  registerMonitoredStationPaths,
  monitoredStationTag,
} from './features/monitoredStations/paths';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

registerMonitoredStationPaths(registry);

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'WeatherFlow - Ingesting API',
      description:
        'Manages which weather stations receive external data ingestion, based on events from the station management service.',
    },
    servers: [
      { url: '/', description: 'Default server (relative path)' },
      { url: 'http://localhost:3002', description: 'Local development server (Host port)' },
    ],
    tags: [monitoredStationTag],
  });
}
