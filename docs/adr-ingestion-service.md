# ADR-01: Componente de Ingesta de OpenWeatherMap como Microservicio Independiente

## Contexto

WeatherFlow necesita incorporar OpenWeatherMap (OWM) como fuente de datos externos: consultarla periódicamente para un conjunto configurable de estaciones y enrutar las mediciones obtenidas al mismo pipeline de dominio que ya procesa los datos de las estaciones físicas.

La pregunta a responder es **dónde ubicar esta lógica dentro de la arquitectura existente**. Las opciones concretas evaluadas fueron:

- **Opción A:** Nuevo microservicio independiente (`ingesting`).
- **Opción B:** Adaptador dentro del microservicio existente `alerting`.

## Decisión

Se implementa la ingesta de OWM como un **nuevo microservicio independiente** (`ingesting`), con su propio ciclo de vida, base de datos y conexión a RabbitMQ.

## Justificación

### 1. Aislamiento de Fallos

Este es el argumento más crítico dado el dominio del sistema.

`alerting` es el core domain: debe poder procesar mediciones y disparar alertas en todo momento, independientemente del estado de sistemas externos. OWM puede tener caídas, latencia elevada o rate limiting — ninguna de esas situaciones debe afectar la capacidad del sistema de procesar mediciones manuales ni de generar alertas.

Al separar la ingesta en su propio proceso, el circuit breaker y el timeout se aplican en la frontera de `ingesting`. Si OWM falla, `ingesting` absorbe ese fallo de forma aislada: `alerting` continúa operando sin degradación. Si la ingesta viviera dentro de `alerting`, un pool de threads bloqueado esperando respuesta de OWM podría contaminar la latencia del procesamiento de mediciones que llegan por otras vías.

### 2. Volatilidad Diferente

La lógica de ingesta y la de alertas cambian por razones completamente distintas:

- `ingesting` cambia cuando OWM modifica su API, su esquema de autenticación o su formato de respuesta, o cuando se quiere incorporar un nuevo proveedor climático externo.
- `alerting` cambia cuando evolucionan las reglas de negocio: nuevos umbrales, nuevas condiciones, nuevos tipos de alerta.

Alojar ambas responsabilidades en `alerting` implicaría que un cambio puramente externo al dominio (la API de OWM) fuerza un redespliegue del motor de alertas.

### 3. Escalabilidad Asimétrica

El scheduler de ingesta es un job periódico de baja frecuencia: corre cada N minutos, realiza un número acotado de llamadas (una por estación) y termina. Su perfil de carga es completamente diferente al de `alerting`, que soporta un flujo continuo y potencialmente alto de mediciones.

Mantenerlos separados permite escalar `alerting` horizontalmente sin arrastrar instancias innecesarias del scheduler, evitando además el problema de múltiples instancias ejecutando el mismo job en paralelo.

### 4. Responsabilidad Única y Bounded Context

`alerting` tiene una responsabilidad clara: recibir mediciones y decidir si generan alertas. No le corresponde saber de dónde vienen esas mediciones ni cómo se obtienen. Incorporar la consulta a OWM, el manejo de credenciales y la transformación del esquema externo al dominio interno rompe esa cohesión.

`ingesting` actúa como **anti-corruption layer** entre OWM y el dominio de WeatherFlow: traduce el esquema externo al modelo interno y lo inyecta al pipeline existente. Las mediciones de OWM son indistinguibles de las manuales desde la perspectiva de `alerting`.

## Alternativas Consideradas

| Alternativa | Por qué se descartó |
|---|---|
| Adaptador dentro de `alerting` | Acopla la disponibilidad del core domain al estado de OWM. Un fallo de OWM podría degradar el procesamiento de alertas manuales. |
| HTTP directo `ingesting` → `alerting` (fire-and-forget) | Los datos se pierden si `alerting` está caído en el momento exacto de la ingesta. Con ciclos de 5 minutos, una caída de 20 minutos implica perder 4 ciclos irrecuperables. |

## Decisiones de Implementación Clave

### Comunicación vía RabbitMQ (no HTTP)
`ingesting` publica mediciones al exchange `ingested-measurements`. `alerting` las consume desde la queue `alerting.ingested-measurements`. Los mensajes son persistentes y durables: si `alerting` se cae y vuelve, procesa todo lo acumulado durante la caída sin pérdida de datos.

### Tolerancia a Fallos en el cliente OWM
El `OWMHttpClient` aplica tres estrategias en cascada:
- **Timeout** (`AbortController`, default 5s): evita que el scheduler quede bloqueado indefinidamente ante latencia de OWM.
- **Circuit Breaker** (threshold: 3 fallos, recovery: 30s): ante fallas sostenidas de OWM, corta el circuito para no acumular requests fallidos y permite recuperación gradual.
- **Bulkhead por estación**: cada estación se procesa en un `try/catch` individual. El fallo de una estación no aborta el ciclo completo.

El Circuit Breaker se implementó manualmente (~70 líneas) en lugar de usar `opossum` porque la librería introduce impedancia de async/await difícil de manejar en Jest, y una implementación manual es completamente testeable con `jest.useFakeTimers()`.

### Sin cache de fallback: preferir el hueco al dato inventado
Si OWM falla, la estación se saltea en ese ciclo y se genera un hueco en la serie temporal. Esto es preferible a publicar datos cacheados con timestamp de "ahora" pero con valores de un momento anterior — un dato engañoso que contaminaría la serie temporal y podría disparar alertas incorrectas.

### Propagación de coordenadas vía eventos
Las coordenadas geográficas se incluyen en los eventos `StationCreated` y `StationUpdated` de `station_management` y se persisten en `ingesting`. Esto permite que `ingesting` opere de forma autónoma sin necesidad de consultar `station_management` en tiempo de ingesta, eliminando una dependencia de disponibilidad.

### Procesamiento secuencial de estaciones
El loop de ingesta usa `for...of` (secuencial) en lugar de `Promise.all` (paralelo). OpenWeatherMap free tier tiene un límite de 60 requests/minuto; el procesamiento secuencial naturalmente limita la tasa y evita superar ese límite con muchas estaciones.

## Consecuencias

**Positivas:**
- `alerting` no se modifica y su disponibilidad no depende del estado de OWM.
- La lógica de ingesta es testeable de forma aislada, sin necesidad de levantar el pipeline completo.
- Incorporar un nuevo proveedor climático en el futuro implica solo modificar `ingesting`.
- Las credenciales de OWM están aisladas en un único servicio.
- Cero pérdida de datos ante caídas de `alerting` gracias a la durabilidad de RabbitMQ.

**Negativas:**
- Un servicio adicional para operar, monitorear y deployar.
- Latencia adicional en el flujo: OWM → `ingesting` → RabbitMQ → `alerting`, en comparación con OWM → `alerting` directo.
- Posible pérdida del primer measurement de una estación recién creada si el evento `StationCreated` aún no fue procesado por `alerting` (race condition entre queues). Se acepta como trade-off: afecta solo al primer ciclo de ingesta de una estación nueva.

La complejidad operacional adicional se considera aceptable dado que la infraestructura de Docker Compose ya está establecida y los beneficios de aislamiento superan el overhead en el contexto de un sistema de monitoreo climático crítico.
