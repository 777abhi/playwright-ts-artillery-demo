# Performance App

This is a simple web application designed for performance testing, consisting of a React frontend and a Fastify backend.

## Performance Simulation

This application allows you to simulate real-world bottlenecks via the Settings panel or API parameters.

| Scenario | delay (ms) | cpuLoad (loops) | memoryStress (MB) | jitter (ms) | Description |
|---|---|---|---|---|---|
| Optimal | 0 | 0 | 0 | 0 | Base performance of the stack. |
| DB Latency | 1500 | 0 | 0 | 0 | Simulates slow SQL queries or external API lag. |
| CPU Bound | 100 | 10^7 | 0 | 0 | Simulates heavy data processing or encryption. |
| Memory Stress | 0 | 0 | 50 | 0 | Simulates high memory consumption (allocates 50MB buffer). |
| Service Fail | -1 | N/A | N/A | 0 | Simulates 500 errors (when delay is negative). |
| Network Jitter | 1000 | 0 | 0 | 500 | Simulates variable network latency (1000ms ± 500ms). |

### Simulation Presets

The frontend includes "Preset Buttons" for common scenarios (Optimal, DB Latency, CPU Bound, Memory Stress, Service Fail, Network Jitter). Simply click a button to populate the simulation settings instantly.

## Real-time Metrics

The application includes a real-time metrics dashboard on the frontend, displaying:
- Total Requests
- Error Rate
- Average, Minimum, and Maximum Latency

Metrics are collected by the backend and exposed via the `/metrics` endpoint. You can reset these metrics at any time using the "Reset Metrics" button in the dashboard.

The dashboard also features a **Real-time Metrics History** chart, visualizing latency and error rate trends over the last 30 data points. This history is persisted in the backend (in-memory) and served via the API, ensuring consistency across page reloads.

## Running the App

To start both the frontend and backend services:

```bash
docker-compose up --build
```

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001

## Future Improvements

- Persist metrics to a persistent time-series database (e.g., Prometheus, InfluxDB) for long-term historical analysis.
- Implement distributed tracing (e.g., OpenTelemetry) for detailed request analysis.
- Add authentication to secure the simulation control panel and metrics endpoints.
