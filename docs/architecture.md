# Decisiones Arquitectónicas: Separación de Componentes

Este documento detalla las justificaciones teóricas y técnicas detrás de la separación del sistema WeatherFlow en dos microservicios independientes (`station_management` y `alerting`), utilizando una Arquitectura Hexagonal y orientada a eventos.

## 1. Responsabilidad de cada Componente (Bounded Contexts)

Para mantener un alto grado de cohesión y un bajo nivel de acoplamiento, el dominio de la aplicación se dividió en dos Bounded Contexts principales:

### A. Station Management (Gestión y Administración)
- **Responsabilidad Core:** Actuar como la única fuente de la verdad para la gestión de identidades y recursos estáticos. Maneja el ciclo de vida de los Usuarios, el registro de las Estaciones Meteorológicas y las Suscripciones a alertas.
- **Naturaleza del Dominio:** Es un servicio orientado a transacciones de administración (ABM/CRUD). La tasa de escritura (creación de usuarios/estaciones) es extremadamente baja en comparación con el volumen general del sistema.

### B. Alerting (Ingesta y Telemetría)
- **Responsabilidad Core:** Recibir, procesar y evaluar las mediciones climáticas en tiempo real. Es responsable de aplicar las reglas de negocio (ej. umbrales de temperatura) y disparar notificaciones de alerta cuando las condiciones son peligrosas.
- **Naturaleza del Dominio:** Es el motor de procesamiento pesado del sistema. Recibe un flujo constante e ininterrumpido de mediciones (datos de series de tiempo) con un alto nivel de transaccionalidad (alto *throughput*).

## 2. Justificaciones para la Separación Física en Microservicios

Aunque ambos contextos podrían haber vivido en un sistema monolítico, se decidió separarlos físicamente basándonos en los siguientes cuatro pilares arquitectónicos:

### 2.1 Escalabilidad Asimétrica
Los requerimientos de carga de ambos dominios son drásticamente diferentes. Mientras que `station_management` recibe muy pocas peticiones (un usuario se registra una sola vez), el servicio de `alerting` debe soportar a miles de estaciones enviando telemetría cada pocos segundos o minutos. Separarlos permite **escalar horizontalmente solo el servicio de `alerting`**, optimizando el uso de recursos y ahorrando costos de infraestructura.

### 2.2 Aislamiento a Fallos (Resiliencia)
Esta es una justificación crítica para la infraestructura de emergencias climáticas. Si el portal de administración (`station_management`) sufre una caída (por un pico de tráfico, un bug en un despliegue, o un fallo en su base de datos), **el procesamiento de alertas no debe verse afectado**. 
Al ser servicios separados, la caída de uno no arrastra al otro. Las estaciones pueden seguir enviando mediciones a `alerting` y las alertas de peligro seguirán emitiéndose, garantizando la alta disponibilidad del *Core Domain*.

### 2.3 Persistencia Políglota y Patrones de Acceso
El patrón de acceso a los datos difiere completamente:
- `station_management` requiere consultas relacionales o de grafos ligeros (saber qué estaciones pertenecen a qué usuario).
- `alerting` requiere inserciones de tipo "Append-Only" a una velocidad altísima (Series de Tiempo) y lecturas de agregación (promedios, máximos). 
Al separarlos, cada servicio es dueño de su propia base de datos (Database-per-Service pattern), lo que permite en un futuro utilizar una tecnología optimizada para series temporales (como InfluxDB o MongoDB Time Series) en `alerting` sin forzar ese motor sobre los datos de usuarios.

### 2.4 Desacoplamiento Tecnológico y Cognitivo
El uso de una arquitectura dirigida por eventos (mediante RabbitMQ) permite que `alerting` reaccione asíncronamente a los cambios en `station_management` (por ejemplo, escuchando el evento `StationCreated`). Este desacoplamiento significa que distintos equipos pueden iterar sobre las reglas de alertas complejas sin riesgo de introducir errores de compilación o de lógica en el sistema de login y registro.
