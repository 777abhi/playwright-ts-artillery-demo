import * as fs from 'fs';
import * as path from 'path';

/**
 * Custom report generator for Artillery v2.
 * The `artillery report` command is deprecated in v2 and no longer generates HTML reports locally.
 * This script parses the JSON output and generates a basic HTML report with charts.
 */

// Parse command line arguments
const reportFile = process.argv[2] || 'report.json';
const outputFile = process.argv[3] || reportFile.replace('.json', '.html');

if (!fs.existsSync(reportFile)) {
  console.error(`Report file ${reportFile} not found.`);
  process.exit(1);
}

try {
  const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
  const aggregate = report.aggregate;
  const intermediate = report.intermediate;

  if (!aggregate || !intermediate) {
    console.error('Invalid report format: Missing aggregate or intermediate data.');
    process.exit(1);
  }

  // Extract metrics for charts
  const labels = intermediate.map((i: any) => new Date(i.timestamp || i.period).toLocaleTimeString());

  const requestRates = intermediate.map((i: any) =>
    (i.rates && i.rates['http.request_rate']) ? i.rates['http.request_rate'] : 0
  );

  // p95 latency
  const p95Latencies = intermediate.map((i: any) =>
    (i.summaries && i.summaries['http.response_time']) ? i.summaries['http.response_time'].p95 : 0
  );

  // Errors (sum of all counters starting with 'errors.')
  const errors = intermediate.map((i: any) => {
    if (!i.counters) return 0;
    return Object.keys(i.counters)
      .filter((k: string) => k.startsWith('errors.'))
      .reduce((acc: number, k: string) => acc + i.counters[k], 0);
  });

  // Aggregate metrics
  const totalRequests = (aggregate.counters && aggregate.counters['http.requests']) || 0;
  const maxLatency = (aggregate.summaries && aggregate.summaries['http.response_time']) ? aggregate.summaries['http.response_time'].max : 'N/A';
  const p95LatencyAgg = (aggregate.summaries && aggregate.summaries['http.response_time']) ? aggregate.summaries['http.response_time'].p95 : 'N/A';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Artillery Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: sans-serif; margin: 20px; background-color: #f4f4f9; }
    h1 { text-align: center; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; }
    .summary { display: flex; justify-content: space-around; margin-bottom: 30px; flex-wrap: wrap; }
    .card {
      background: white;
      border: 1px solid #ddd;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      width: 200px;
      margin: 10px;
    }
    .card h3 { margin: 0 0 10px; color: #666; font-size: 1rem; }
    .card p { margin: 0; font-size: 1.5rem; font-weight: bold; color: #333; }
    .chart-container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Performance Report</h1>

    <div class="summary">
      <div class="card">
        <h3>Total Requests</h3>
        <p>${totalRequests}</p>
      </div>
      <div class="card">
        <h3>Max Latency (ms)</h3>
        <p>${maxLatency}</p>
      </div>
      <div class="card">
        <h3>p95 Latency (ms)</h3>
        <p>${p95LatencyAgg}</p>
      </div>
    </div>

    <div class="chart-container">
      <canvas id="rpsChart"></canvas>
    </div>

    <div class="chart-container">
      <canvas id="latencyChart"></canvas>
    </div>
  </div>

  <script>
    const ctxRps = document.getElementById('rpsChart').getContext('2d');
    new Chart(ctxRps, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(labels)},
        datasets: [{
          label: 'Requests per Second',
          data: ${JSON.stringify(requestRates)},
          borderColor: '#36a2eb',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
          tension: 0.1
        }, {
          label: 'Errors',
          data: ${JSON.stringify(errors)},
          borderColor: '#ff6384',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Request Rate & Errors', font: { size: 16 } },
          tooltip: { mode: 'index', intersect: false }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        scales: {
          x: { display: true, title: { display: true, text: 'Time' } },
          y: { display: true, title: { display: true, text: 'Count' }, beginAtZero: true }
        }
      }
    });

    const ctxLatency = document.getElementById('latencyChart').getContext('2d');
    new Chart(ctxLatency, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(labels)},
        datasets: [{
          label: 'p95 Latency (ms)',
          data: ${JSON.stringify(p95Latencies)},
          borderColor: '#4bc0c0',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Latency (p95)', font: { size: 16 } },
          tooltip: { mode: 'index', intersect: false }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        scales: {
          x: { display: true, title: { display: true, text: 'Time' } },
          y: { display: true, title: { display: true, text: 'Milliseconds' }, beginAtZero: true }
        }
      }
    });
  </script>
</body>
</html>
`;

  fs.writeFileSync(outputFile, html);
  console.log(`Report generated: ${outputFile}`);

} catch (error) {
  console.error('Error generating report:', error);
  process.exit(1);
}
