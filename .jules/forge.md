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
