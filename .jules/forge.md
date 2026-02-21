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
