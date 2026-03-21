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

## 2026-03-06 - Distributed Trace Sampling Strategies
Decision: Configured `ParentBasedSampler` with `TraceIdRatioBasedSampler` in the OpenTelemetry `NodeSDK` to enable probability-based sampling.
Reasoning: To manage cost and performance overhead in high-throughput environments by tracing a representative percentage of requests instead of every single one.
Constraint: The sampling ratio is configurable via `TRACE_SAMPLE_RATIO`, defaulting to 0.1 (10%). Head-based sampling drops the trace completely, so any attached logs will lack `traceId` context for non-sampled requests.

## 2026-03-07 - Dynamic Sampling
Decision: Implemented `DynamicRatioSampler` to allow updating trace sampling ratio at runtime and exposed endpoints and UI controls for it.
Reasoning: To provide immediate, frictionless management of trace sampling directly from the UI without requiring environment variable updates and server restarts.
Constraint: The underlying OpenTelemetry sampler isn't inherently mutable, requiring a custom adapter that dynamically forwards sampling decisions to a newly constructed `TraceIdRatioBasedSampler` when ratio changes.

## 2026-03-08 - Dynamic Simulation Presets and Caching
Decision: Shifted simulation presets from the frontend to a backend `PresetService` utilizing a new `ICacheProvider` with an in-memory cache implementation.
Reasoning: To decouple frontend configuration, reduce repetitive configuration loading via caching, and establish an extensible architecture for future database-backed dynamic preset management.
Constraint: The current `InMemoryCache` is ephemeral. Future scalable implementations will require a distributed cache provider (e.g. Redis).

## 2026-03-09 - Automated Trace Sampling Adjustment
Decision: Created `AutoSamplerService` to dynamically adjust trace sampling ratios based on current request traffic volume, tracked via `requests` added to `MetricPoint` history.
Reasoning: To automatically manage tracing overhead during traffic spikes by reducing sampling, and ensure robust observation during low-traffic periods by increasing sampling, preventing exporter overload without manual intervention.
Constraint: Adjustment logic relies on interval requests. Thresholds for high/low load and step adjustments should be configurable (currently hardcoded constants) to allow fine-tuning per environment.

## 2026-03-11 - API Key Authentication
Decision: Implemented `AuthService` and Fastify request hook to secure sensitive simulation API endpoints (`/process`, `DELETE /metrics`).
Reasoning: To secure the simulation control panel from unauthorized execution or resets by verifying an `x-api-key` header against the `API_KEY` backend environment variable.
Constraint: When `API_KEY` is undefined, the backend defaults to open access for backward-compatible development. Future iterations should add RBAC instead of simple boolean checks.

## 2026-03-12 - Role-Based Access Control (RBAC)
Decision: Enhanced `AuthService` with RBAC defining ADMIN, USER, and GUEST roles using `ADMIN_API_KEY` and `USER_API_KEY` alongside legacy `API_KEY`. Moved authorization checks from a global `onRequest` hook to explicit endpoint validations.
Reasoning: To establish fine-grained control over simulation parameters. Now, only ADMIN can trigger severe simulations like negative delays (Service Fail) and memory stress, or reset metrics, while USER has basic delay and CPU manipulation rights.
Constraint: GUEST users have no execute permissions. For backwards compatibility, legacy `API_KEY` behaves as `ADMIN_API_KEY`.

## 2026-03-12 - Intelligent Head-based Sampling
Decision: Implemented `IntelligentSampler` to wrap `DynamicRatioSampler`.
Reasoning: To guarantee distributed tracing for known degraded paths (high latency, memory stress, CPU load, errors) regardless of the prevailing traffic-based dynamic sampling ratio. This ensures critical observability data is never lost due to random sampling drops.
Constraint: Sampling decision is based on request attributes (URL params). Ensure these parameters remain consistent across future simulation extensions.

## 2026-03-13 - Anomaly Detection
Decision: Implemented AnomalyDetectorService with sliding window baseline logic to detect latency spikes and high error rates.
Reasoning: To automatically notify the frontend of sudden performance deviations without requiring manual observation.
Constraint: Anomalies are detected based on in-memory history. Future implementations should rely on a persistent data store for long-term historical analysis.

## 2026-03-14 - SQLite Database Persistence
Decision: Introduced `DatabaseService` using SQLite to persistently store metrics snapshots and detected anomalies. Added `GET /metrics/history/long-term` endpoint.
Reasoning: To enable long-term historical analysis beyond the recent memory window. SQLite provides a lightweight, zero-configuration embedded database perfect for this standalone performance application without adding complex external dependencies like PostgreSQL to the stack.
Constraint: Ensure database queries are optimized if the volume of historical data grows significantly.

## 2026-03-15 - Long-Term Metrics Visualization
Decision: Created `LongTermMetrics` component to fetch and render historical data from the SQLite database.
Reasoning: To provide a visual interface for analyzing performance trends over longer periods (24h, 7d, 30d) rather than just the recent 30-point memory window.
Constraint: Fetching very large datasets could cause performance issues on the frontend. Data aggregation may be necessary for longer timeframes in the future.

## 2026-03-16 - Advanced Load Testing Configurations
Decision: Introduced `LoadTestingPanel` component and concurrent execution logic in `App.tsx`.
Reasoning: To allow users to simulate concurrent traffic directly from the UI without relying on external CLI tools, making it easier to verify performance scenarios interactively.
Constraint: High concurrency might block the browser's main thread or hit browser connection limits (typically 6 per origin). Future improvements should consider Web Workers.

## 2026-03-17 - Web Worker for Load Generation
Decision: Extracted the concurrent user execution loop from `App.tsx` into a dedicated Web Worker (`loadTest.worker.ts`).
Reasoning: To offload intense concurrent HTTP request generation from the main UI thread, ensuring the React application remains responsive during heavy load tests.
Constraint: Web Workers still abide by the browser's concurrent connection limits per origin. This is a frontend architectural improvement, not a bypass of browser network constraints.

## 2026-03-18 - Automated Load Tests Integration
Decision: Replaced external SauceDemo target in `artillery.yml` with the local application load test.
Reasoning: To integrate automated load tests using Playwright and Artillery directly into the deployment pipeline, ensuring that performance profiles are automatically verified before releasing new builds.
Constraint: Load tests are run against `http://localhost:3000` via Artillery `processor` config pointing to `tests/performance-steps.ts`.

## 2026-03-19 - GraphQL Integration
Decision: Integrated GraphQL via `mercurius` to expose backend data (metrics, presets, traceRatio, longTermMetrics).
Reasoning: To establish a flexible querying mechanism that reduces over-fetching/under-fetching compared to standard REST endpoints, improving frontend performance over constrained networks.
Constraint: As the schema evolves, ensure strong type definitions and maintain resolver performance to prevent the GraphQL endpoint from becoming a new bottleneck.

## 2026-03-20 - AI-driven Analysis of Metrics History
Decision: Implemented `AiAnalysisService` with heuristic rules and exposed it via GraphQL.
Reasoning: To automatically recommend optimal architecture scaling or auto-remediation actions based on real-time metrics, fulfilling the vision of intelligent system observability.
Constraint: Current implementation uses deterministic heuristics rather than true ML models. Future iterations should integrate an external ML inference service for deeper insights.

## 2026-03-21 - Predictive Scaling and Event-Driven Refactor
Decision: Implemented `PredictiveScalingService` and refactored backend `app.ts` to use Node.js `EventEmitter` for metrics snapshots.
Reasoning: To predictively auto-scale based on sharp request trends and to decouple the monolithic `setInterval` loop into an Event-Driven architecture, allowing independent listeners for auto-sampling, anomaly detection, persistence, and websocket streaming.
Constraint: Ensure all future asynchronous operations reacting to metrics snapshots are registered as event listeners rather than modifying the core emission loop.
