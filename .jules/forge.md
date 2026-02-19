## 2025-02-13 - Memory Stress Simulation
Decision: Introduced Service Layer and Unit Testing (Vitest)
Reasoning: To decouple business logic from transport layer and enable reliable testing of simulation logic without starting the server.
Constraint: Keep services stateless where possible, but allow controlled state (memory allocation) for simulation purposes.

## 2025-02-14 - Frontend TypeScript Migration & Simulation Presets
Decision: Migrated Frontend to TypeScript and introduced Simulation Presets.
Reasoning: To enforce the strict TypeScript policy, improve code quality, and enhance user experience for setting up simulations.
Constraint: Frontend code must remain TypeScript-only (.tsx). Ensure future features add corresponding preset buttons if applicable.
