# ADR-02: Estrategia de Observabilidad

## Contexto

WeatherFlow es un sistema de monitoreo climático compuesto por tres microservicios que se comunican de forma asíncrona vía RabbitMQ. Una medición recorre el siguiente camino antes de convertirse en una alerta:

```
[ingesting] cron → OWM HTTP → RabbitMQ → [alerting] → MongoDB → RabbitMQ (climate-alerts)
```

Sin observabilidad, diagnosticar un problema en este flujo es muy difícil: ¿la medición llegó? ¿falló en OWM? ¿en la queue? ¿en el procesamiento de alertas? El sistema necesita las tres dimensiones de observabilidad:

- **Logs**: visibilidad de eventos discretos (requests HTTP, mensajes encolados, fallos, transiciones del circuit breaker).
- **Métricas**: series temporales para detectar tendencias y disparar alertas (tasa de ingesta, tasa de alertas, error rate de OWM, latencia de endpoints).
- **Trazas distribuidas**: capacidad de seguir una medición desde el cron de ingesta hasta la alerta publicada, cruzando dos microservicios y RabbitMQ en una sola vista.

**Restricciones:**
- Todo el stack debe correr en Docker Compose sin licencias comerciales.
- La instrumentación debe ser mínimamente invasiva: sin cambios en la lógica de negocio ni de dominio.
- Los tres pilares deben ser correlacionables desde una única interfaz (click en una traza → logs de ese request).

## Decisión

Se adopta el **stack Grafana** (Alloy + Loki + Tempo + Grafana) para logs y trazas, **Prometheus + prom-client** para métricas, **cAdvisor** para métricas de infraestructura, y el **SDK de OpenTelemetry** para instrumentación de código.

## Justificación

### 1. Stack unificado Grafana para los tres pilares

Se eligió el stack Grafana completo (Loki para logs, Tempo para trazas, Prometheus para métricas, Grafana como UI) porque permite **correlación nativa entre pilares**: desde un span en Tempo se puede saltar con un click a los logs de Loki con el mismo `traceId`, y desde un log se puede navegar a las métricas del momento. Esta correlación es el valor diferencial clave — sin ella, diagnosticar un problema requiere abrir tres herramientas diferentes y cruzar información manualmente.

Todas las herramientas son open-source y corren en Docker Compose sin licencias ni dependencias externas.

### 2. Logging estructurado con Pino

Los tres servicios usan `pino` como librería de logging. Pino emite JSON estructurado a stdout nativamente — sin formatters adicionales — lo que permite a Alloy parsear los logs y extraer `level` y `traceId` como labels indexados en Loki. Su rendimiento es significativamente superior a winston (5x–10x más throughput), relevante para `alerting` que procesa un flujo continuo de mediciones.

Se agrega `genReqId` a `pino-http` para generar un UUID único por cada request HTTP, aceptando el header `X-Request-Id` entrante si existe. Sin este ID, los logs de requests concurrentes son imposibles de correlacionar. Los requests a `GET /health` se excluyen del autoLogging para evitar decenas de entradas por minuto que no aportan información operacional.

### 3. OpenTelemetry para distributed tracing

Se usa `@opentelemetry/sdk-node` con `getNodeAutoInstrumentations()`, que auto-instrumenta Express, Mongoose y HTTP outbound sin modificar el código de negocio. OpenTelemetry es el estándar de la industria (CNCF graduated), vendor-neutral: la instrumentación no genera lock-in con ningún proveedor.

El desafío central era seguir una traza a través de RabbitMQ, ya que `amqplib` no tiene auto-instrumentación en OTel. Se implementó propagación manual del contexto de traza usando el estándar **W3C TraceContext**: al publicar un mensaje se inyecta el header `traceparent` en las propiedades AMQP; al consumir se extrae y se restaura el contexto. Esto produce un árbol de trazas continuo desde el tick del cron de `ingesting` hasta la publicación en `climate-alerts`:

```
[ingesting] ingestion.cycle
  └─ HTTP GET openweathermap.org
  └─ rabbitmq.publish ingested-measurements
       └─ [alerting] rabbitmq.consume
            └─ mongoose.save
            └─ rabbitmq.publish climate-alerts
```

### 4. prom-client para métricas de aplicación y negocio

Cada servicio expone `GET /metrics` en formato Prometheus usando `prom-client`, en el mismo puerto Express para no requerir un listener adicional. `collectDefaultMetrics()` expone automáticamente event loop lag, heap, GC y CPU usage. Se agregan contadores de negocio específicos por servicio:

- **ingesting**: `owm_fetch_total{status}`, `measurements_ingested_total`, `ingestion_cycle_duration_ms`, `owm_circuit_breaker_state`.
- **alerting**: `measurements_consumed_total{status}`, `alerts_triggered_total{alert_type}`, `dlq_messages_total`.
- **station_management**: `station_events_published_total{event_type}`.

Un middleware Express registra `http_request_duration_ms` como Histogram con labels `method`, `route` y `status_code`, cubriendo las métricas por endpoint sin modificar los handlers.

### 5. Grafana Alloy para recolección de logs

Grafana Alloy (sucesor oficial de Promtail) recolecta los logs de los contenedores vía la API de Docker y los envía a Loki, sin modificar los servicios. Se eligió Alloy sobre Promtail porque usa la API de Docker ≥1.44, requerida por versiones recientes de Docker Desktop. Promtail 2.9.x está limitado a la API 1.42 y no puede negociar versiones superiores (la env var `DOCKER_API_VERSION` no es respetada por su SDK de Go).

### 6. Alertas como código con Prometheus Alerting

Las reglas de alerta se definen en YAML versionado en el repositorio (`observability/prometheus/rules/`), evaluadas por Prometheus y visualizadas en Grafana Alerting. Las reglas cubren los eventos operacionales más críticos: servicio caído, circuit breaker abierto, ausencia de ingesta por más de 10 minutos, acumulación en DLQ, alta tasa de error HTTP y uso excesivo de CPU.

Definirlas como código permite versionarlas con git y testearlas offline con `promtool check rules`, sin depender de una interfaz gráfica para configurarlas.

## Alternativas Consideradas

| Alternativa | Por qué se descartó |
|---|---|
| ELK Stack (Elasticsearch + Logstash + Kibana) | Más maduro pero significativamente más pesado. Elasticsearch requiere al menos 2GB de heap. Kibana no tiene integración nativa con trazas ni métricas de Prometheus. |
| Promtail 2.9.x | Incompatible con Docker Desktop moderno (API 1.42 vs. requerida ≥1.44). |
| Paquete compartido para la instrumentación | Evitaría duplicar `metrics.ts` y `metricsMiddleware.ts` en los tres servicios. Requiere configurar npm workspaces o herramientas de monorepo (Turborepo, Nx), complejidad fuera del scope actual. Se acepta como deuda técnica. |

## Consecuencias

**Positivas:**
- Los tres pilares son correlacionables desde Grafana con un click: de un span a sus logs, de un log a las métricas del momento.
- La instrumentación es no-invasiva: cero cambios en la lógica de dominio o de aplicación.
- Todo el stack corre en Docker Compose sin dependencias externas ni licencias.
- Las reglas de alerta son código versionable y testeable offline.
- Una traza en Tempo puede seguirse desde el tick del cron de ingesta hasta la publicación en `climate-alerts`, cruzando RabbitMQ.

**Negativas:**
- El stack de observabilidad agrega 6 contenedores adicionales (Prometheus, Grafana, Loki, Alloy, Tempo, cAdvisor) con su consumo de CPU y memoria correspondiente.
- La propagación manual del contexto de traza en RabbitMQ agrega boilerplate en publishers y consumers.
- Los archivos de instrumentación (`metrics.ts`, `metricsMiddleware.ts`) están duplicados en los tres servicios al no tener un paquete compartido. Se acepta como deuda técnica.
- cAdvisor no funciona correctamente en macOS con Docker Desktop (limitación del entorno de desarrollo). Las métricas de hardware por contenedor están disponibles en la VM de producción (Linux) pero no localmente.
