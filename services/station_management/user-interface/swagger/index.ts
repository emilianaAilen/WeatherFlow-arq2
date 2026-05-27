import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { registerUserPaths, userTag } from './features/users/paths';
import { registerWeatherStationPaths, weatherStationTag } from './features/weatherStations/paths';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

registerUserPaths(registry);
registerWeatherStationPaths(registry);

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'WeatherFlow - Station Management API',
      description:
        'Manages users, weather stations, and subscriptions within the WeatherFlow platform.',
    },
    servers: [
      { url: '/', description: 'Default server (relative path)' },
      { url: 'http://localhost:3000', description: 'Local development server (Host port)' },
    ],
    tags: [userTag, weatherStationTag],
  });
}
