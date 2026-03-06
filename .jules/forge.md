## 2025-02-13 - Memory Stress Simulation
Decision: Introduced Service Layer and Unit Testing (Vitest)
Reasoning: To decouple business logic from transport layer and enable reliable testing of simulation logic without starting the server.
Constraint: Keep services stateless where possible, but allow controlled state (memory allocation) for simulation purposes.

## 2025-02-14 - Frontend TypeScript Migration & Simulation Presets
Decision: Migrated Frontend to TypeScript and introduced Simulation Presets.
Reasoning: To enforce the strict TypeScript policy, improve code quality, and enhance user experience for setting up simulations.
Constraint: Frontend code must remain TypeScript-only (.tsx). Ensure future features add corresponding preset buttons if applicable.

## 2025-02-15 - Service Fail Preset & Refactoring
Decision: Added "Service Fail" preset and extracted presets configuration.
Reasoning: To expose the existing backend capability for 500 errors to the user and improve frontend maintainability by separating configuration from the component.
Constraint: Ensure all new presets are added to the configuration file and have corresponding test steps.

## 2025-02-16 - Network Jitter Simulation
Decision: Added Jitter parameter to SimulationService and exposed via API and Frontend.
Reasoning: To simulate real-world network instability and variable latency, providing more realistic performance testing scenarios.
Constraint: Ensure jitter is clamped to 0 if the resulting delay is negative, but allow explicit negative delay for error simulation.

## 2025-02-21 - Real-time Metrics & Fastify Hooks
Decision: Introduced MetricsService and used Fastify Hooks (`onRequest`, `onResponse`) for global request tracking.
Reasoning: To provide real-time visibility into application performance and decouple metrics collection from business logic.
Constraint: Ensure metrics collection has minimal overhead. Use `WeakMap` or request decoration carefully to avoid memory leaks or type conflicts.

## 2025-02-22 - Reset Metrics Feature
Decision: Exposed `DELETE /metrics` endpoint and added Reset button in frontend.
Reasoning: To allow users to clear accumulated metrics for fresh test runs without restarting the server, improving testing workflow.
Constraint: Ensure metrics reset is atomic or handled gracefully during concurrent requests.

## 2025-02-23 - Frontend Metrics Visualization
Decision: Implemented client-side metrics history buffer and visualization using Recharts. Added Vitest/JSDOM for frontend component testing.
Reasoning: To provide immediate visual feedback on performance trends without introducing backend state complexity yet.
Constraint: History is transient (lost on refresh). Future backend persistence is required for long-term analysis.

## 2025-02-24 - Persist Metrics History
Decision: Moved metrics history buffer from Frontend state to Backend `MetricsService` and exposed via API.
Reasoning: To ensure metrics history is persistent across page reloads and consistent for multiple clients, addressing the limitation of transient frontend history.
Constraint: History is currently in-memory and capped at 30 items. Ensure `setInterval` for snapshots is managed correctly to avoid resource leaks (e.g., using Fastify hooks).

## 2026-02-25 - Windowed Metrics History
Decision: Refactored `MetricsService` to calculate history snapshots using interval-specific data instead of global averages.
Reasoning: To provide a true "real-time" visualization of performance spikes and drops, which were previously obscured by the smoothing effect of cumulative averages.
Constraint: `getMetrics()` continues to return global statistics for the summary dashboard.

## 2026-02-27 - T-Digest for Percentiles
Decision: Replaced array-based sorting with T-Digest algorithm for P95 latency calculation in `MetricsService`.
Reasoning: To improve memory efficiency and computation speed under high request volumes, as sorting unbounded arrays during snapshots is a bottleneck.
Constraint: T-Digest provides approximate percentiles, which may slightly alter exact values in tests, but is highly accurate for tail percentiles.

## 2026-02-28 - Websocket Metrics Streaming
Decision: Replaced HTTP polling with WebSockets (`@fastify/websocket`) for real-time metrics streaming. Refactored server configuration into `app.ts` to allow reliable testing.
Reasoning: To drastically reduce network overhead and improve dashboard responsiveness, completing the WebSocket architectural goal.
Constraint: Ensure WebSocket connections are properly managed and closed to prevent memory leaks. Server startup must use `buildApp()` from `app.ts`.

## 2026-03-01 - Prometheus Metrics Integration
Decision: Implemented `PrometheusService` using `prom-client` and exposed `/metrics/prometheus` endpoint.
Reasoning: To persist and provide external access to metrics (latency, errors) via a standard time-series format (Prometheus), completing a foundational step for long-term historical analysis.
Constraint: Ensure `prom-client` registers custom metrics in its default registry properly to avoid duplicate metric errors and keep the transport layer logic isolated from formatting concerns.

## 2026-03-02 - OpenTelemetry Integration
Decision: Implemented OpenTelemetry distributed tracing using `@opentelemetry/sdk-node` and auto-instrumentations.
Reasoning: To establish a foundation for detailed request analysis and latency profiling by tracing Fastify endpoints.
Constraint: Ensure the tracing module (`src/tracing.ts`) is imported at the absolute top of `server.ts` before `app.ts` or any other module, so the `NodeSDK` initializes before modules are required. Use `resourceFromAttributes` to construct the semantic resource properly.

## 2026-03-03 - OpenTelemetry Jaeger Integration
Decision: Replaced ConsoleSpanExporter with OTLPTraceExporter and added a Jaeger service in docker-compose.yml.
Reasoning: To provide an external user interface for exploring traces visually instead of relying on the console, enabling advanced troubleshooting and latency profiling.
Constraint: Ensure the Jaeger service starts before the backend and the OTLP exporter points to the correct endpoint (http://jaeger:4318/v1/traces).

## 2026-03-04 - Link Traces to Log Lines
Decision: Updated Fastify logger to dynamically extract trace context (`traceId`, `spanId`) using `@opentelemetry/api` and attach them to log lines.
Reasoning: To enable seamless switching between tracing and logging in a unified logging platform, improving system observability and debuggability.
Constraint: Fastify logger formatters must handle undefined spans gracefully to avoid errors when logging outside of an active span context.

## 2026-03-05 - Grafana Dashboard Integration
Decision: Added Prometheus and Grafana services to `docker-compose.yml` with pre-configured datasources and a Performance Dashboard.
Reasoning: To fulfill the architectural goal of instantly visualizing the exposed Prometheus metrics, enabling real-time and historical performance monitoring without manual setup.
Constraint: Ensure dashboard configurations (`.json`) are maintained as code and updated alongside metric changes. Port 3002 is used for Grafana to avoid conflicting with the frontend on 3000.
