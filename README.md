# Performance App

This is a simple web application designed for performance testing, consisting of a React frontend and a Fastify backend.

## Performance Simulation

This application allows you to simulate real-world bottlenecks via the Settings panel or API parameters.

| Scenario | delay (ms) | cpuLoad (loops) | memoryStress (MB) | Description |
|---|---|---|---|---|
| Optimal | 0 | 0 | 0 | Base performance of the stack. |
| DB Latency | 1500 | 0 | 0 | Simulates slow SQL queries or external API lag. |
| CPU Bound | 100 | 10^7 | 0 | Simulates heavy data processing or encryption. |
| Memory Stress | 0 | 0 | 50 | Simulates high memory consumption (allocates 50MB buffer). |
| Service Fail | -1 | N/A | N/A | Simulates 500 errors (when delay is negative). |

### Simulation Presets

The frontend includes "Preset Buttons" for common scenarios (Optimal, DB Latency, CPU Bound, Memory Stress, Service Fail). Simply click a button to populate the simulation settings instantly.

## Running the App

To start both the frontend and backend services:

```bash
docker-compose up --build
```

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
