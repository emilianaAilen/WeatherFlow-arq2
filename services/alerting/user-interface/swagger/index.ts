import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registerMeasurementPaths, measurementTag } from "./features/measurements/paths";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

registerMeasurementPaths(registry);

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "WeatherFlow - Alerting API",
      description:
        "Receives climate measurements and publishes alerts to RabbitMQ when extreme weather conditions are detected.",
    },
    servers: [
      { url: "/", description: "Default server (relative path)" },
      { url: "http://localhost:3001", description: "Local development server (Host port)" },
    ],
    tags: [measurementTag],
  });
}
