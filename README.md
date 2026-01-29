# Performance App

This is a simple web application designed for performance testing, consisting of a React frontend and a Fastify backend.

## Performance Simulation

This application allows you to simulate real-world bottlenecks via the Settings panel or API parameters.

| Scenario | delay (ms) | cpuLoad (loops) | Description |
|---|---|---|---|
| Optimal | 0 | 0 | Base performance of the stack. |
| DB Latency | 1500 | 0 | Simulates slow SQL queries or external API lag. |
| CPU Bound | 100 | 10^7 | Simulates heavy data processing or encryption. |
| Service Fail | -1 | N/A | Simulates 500 errors (when delay is negative). |

## Running the App

To start both the frontend and backend services:

```bash
docker-compose up --build
```

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
