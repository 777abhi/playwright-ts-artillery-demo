import React, { useState, useEffect } from 'react'
import MetricsChart, { MetricPoint } from './components/MetricsChart'
import LongTermMetrics from './components/LongTermMetrics'
import LoadTestingPanel from './components/LoadTestingPanel'
import { presets, Config } from './config/presets'

const API_BASE_URL = 'http://localhost:3001'
const WS_BASE_URL = 'ws://localhost:3001'

interface Result {
  delay: number
  cpuLoad: number
  memoryStress: number
  jitter: number
  duration?: number
  error?: string
  success?: boolean
}

interface Metrics {
  totalRequests: number
  totalErrors: number
  totalLatency: number
  avgLatency: number
  minLatency: number
  maxLatency: number
  errorRate: number
  history: any[]
}

interface Anomaly {
  type: string
  message: string
}

function App() {
  const [delay, setDelay] = useState(0)
  const [cpuLoad, setCpuLoad] = useState(0)
  const [memoryStress, setMemoryStress] = useState(0)
  const [jitter, setJitter] = useState(0)
  const [config, setConfig] = useState<Config>({ delay: 0, cpuLoad: 0, memoryStress: 0, jitter: 0 })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [metricsHistory, setMetricsHistory] = useState<MetricPoint[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [savedMessage, setSavedMessage] = useState('')
  const [fetchedPresets, setFetchedPresets] = useState<Record<string, Config>>({})
  const [traceRatio, setTraceRatio] = useState<number>(0.1)
  const [apiKey, setApiKey] = useState<string>('')
  const [authError, setAuthError] = useState<string>('')
  const [loadTestResult, setLoadTestResult] = useState<{ success: number, errors: number, totalDuration: number } | null>(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/presets`)
      .then(res => res.json())
      .then(data => setFetchedPresets(data))
      .catch(err => console.error('Failed to fetch presets', err))
  }, [])

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE_URL}/metrics/ws`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMetrics({
          totalRequests: data.totalRequests,
          totalErrors: data.totalErrors,
          totalLatency: data.totalLatency,
          avgLatency: data.avgLatency,
          minLatency: data.minLatency,
          maxLatency: data.maxLatency,
          errorRate: data.errorRate,
          history: data.history || []
        });

        if (data.history) {
          const formattedHistory = data.history.map((point: any) => ({
            timestamp: new Date(point.timestamp).toLocaleTimeString(),
            avgLatency: point.avgLatency,
            p95Latency: point.p95Latency,
            errorRate: point.errorRate,
            requests: point.requests,
          }));
          setMetricsHistory(formattedHistory);
        }

        if (data.anomalies) {
          setAnomalies(data.anomalies);
        }
      } catch (err) {
        console.error('Failed to parse websocket metrics message', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    const fetchTraceRatio = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings/trace-ratio`);
        if (response.ok) {
          const data = await response.json();
          setTraceRatio(data.ratio);
        }
      } catch (err) {
        console.error('Failed to fetch trace ratio', err);
      }
    };
    fetchTraceRatio();
  }, []);

  const handleSave = () => {
    setConfig({ delay, cpuLoad, memoryStress, jitter })
    setSavedMessage('Settings saved!')
    setTimeout(() => setSavedMessage(''), 2000)
  }

  const applyPreset = (preset: Config) => {
    setDelay(preset.delay)
    setCpuLoad(preset.cpuLoad)
    setMemoryStress(preset.memoryStress)
    setJitter(preset.jitter)
    setConfig(preset)
    setSavedMessage('')
  }

  const handleLoadTestTrigger = async (concurrentUsers: number, iterations: number) => {
    setLoading(true);
    setResult(null);
    setLoadTestResult(null);
    setAuthError('');

    let successCount = 0;
    let errorCount = 0;
    const startTime = Date.now();

    const runUserSimulations = async () => {
      for (let i = 0; i < iterations; i++) {
        try {
          const response = await fetch(`${API_BASE_URL}/process?delay=${config.delay}&cpuLoad=${config.cpuLoad}&memoryStress=${config.memoryStress}&jitter=${config.jitter}`, {
            headers: {
              'x-api-key': apiKey
            }
          });
          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }
    };

    const userPromises = [];
    for (let u = 0; u < concurrentUsers; u++) {
      userPromises.push(runUserSimulations());
    }

    await Promise.all(userPromises);

    setLoadTestResult({
      success: successCount,
      errors: errorCount,
      totalDuration: Date.now() - startTime
    });
    setLoading(false);
  };

  const handleTrigger = async () => {
    setLoading(true)
    setResult(null)
    setLoadTestResult(null)
    setAuthError('')
    try {
      const response = await fetch(`${API_BASE_URL}/process?delay=${config.delay}&cpuLoad=${config.cpuLoad}&memoryStress=${config.memoryStress}&jitter=${config.jitter}`, {
        headers: {
          'x-api-key': apiKey
        }
      })
      if (response.status === 401 || response.status === 403) {
        setAuthError('Unauthorized: Invalid or missing API key')
        setResult({ delay: 0, cpuLoad: 0, memoryStress: 0, jitter: 0, error: 'Unauthorized' })
        return
      }
      const data: Result = await response.json()
      setResult(data)
    } catch (error) {
      console.error(error)
      setResult({ delay: 0, cpuLoad: 0, memoryStress: 0, jitter: 0, error: 'Failed' })
    } finally {
      setLoading(false)
    }
  }

  const resetMetrics = async () => {
    setAuthError('')
    try {
      const response = await fetch(`${API_BASE_URL}/metrics`, {
        method: 'DELETE',
        headers: {
          'x-api-key': apiKey
        }
      })
      if (response.status === 401 || response.status === 403) {
        setAuthError('Unauthorized: Invalid or missing API key for resetting metrics')
        return
      }
      setMetrics(prev => prev ? { ...prev, totalRequests: 0, totalErrors: 0, totalLatency: 0, avgLatency: 0, minLatency: 0, maxLatency: 0, errorRate: 0, history: [] } : null)
      setMetricsHistory([])
    } catch (error) {
      console.error('Failed to reset metrics', error)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Performance Simulation</h1>

      {authError && (
        <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', marginBottom: '20px', border: '1px solid #f5c6cb', borderRadius: '4px' }}>
          {authError}
        </div>
      )}

      {anomalies.length > 0 && (
        <div style={{ padding: '10px', backgroundColor: '#fff3cd', color: '#856404', marginBottom: '20px', border: '1px solid #ffeeba', borderRadius: '4px' }}>
          <strong>Anomalies Detected!</strong>
          <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
            {anomalies.map((anomaly, index) => (
              <li key={index}>{anomaly.message}</li>
            ))}
          </ul>
        </div>
      )}

      <LongTermMetrics apiBaseUrl={API_BASE_URL} />

      {metrics && (
        <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px', background: '#f9f9f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2 style={{ margin: 0 }}>Real-time Metrics</h2>
            <button
              id="reset-metrics-button"
              onClick={resetMetrics}
              style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Reset Metrics
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            <div><strong>Requests:</strong> {metrics.totalRequests}</div>
            <div><strong>Errors:</strong> {metrics.totalErrors}</div>
            <div><strong>Error Rate:</strong> {(metrics.errorRate * 100).toFixed(1)}%</div>
            <div><strong>Avg Latency:</strong> {metrics.avgLatency.toFixed(0)}ms</div>
            <div><strong>Min Latency:</strong> {metrics.minLatency}ms</div>
            <div><strong>Max Latency:</strong> {metrics.maxLatency}ms</div>
          </div>
          <div style={{ marginTop: '20px' }}>
             <MetricsChart data={metricsHistory} />
          </div>
        </div>
      )}

      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h2>Presets</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {Object.entries(fetchedPresets).map(([name, config]) => (
            <button
              key={name}
              id={`preset-${name.toLowerCase().replace(/ /g, '-')}`}
              onClick={() => applyPreset(config)}
              style={{ padding: '5px 10px' }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h2>Settings</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>
            API Key:
            <input
              id="api-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{ marginLeft: '10px' }}
              placeholder="Enter API Key to unlock features"
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Delay (ms):
            <input
              id="delay-input"
              type="number"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              style={{ marginLeft: '10px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Jitter (ms):
            <input
              id="jitter-input"
              type="number"
              value={jitter}
              onChange={(e) => setJitter(Number(e.target.value))}
              style={{ marginLeft: '10px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            CPU Load (loops):
            <input
              id="cpu-input"
              type="number"
              value={cpuLoad}
              onChange={(e) => setCpuLoad(Number(e.target.value))}
              style={{ marginLeft: '10px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Memory Stress (MB):
            <input
              id="memory-input"
              type="number"
              value={memoryStress}
              onChange={(e) => setMemoryStress(Number(e.target.value))}
              style={{ marginLeft: '10px' }}
            />
          </label>
        </div>
        <button id="save-settings" onClick={handleSave}>Save Settings</button>
        {savedMessage && <span style={{ marginLeft: '10px', color: 'blue' }}>{savedMessage}</span>}
      </div>

      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h2>Observability</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Trace Sampling Ratio (0.0 to 1.0):
            <input
              id="trace-ratio-input"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={traceRatio}
              disabled
              style={{ marginLeft: '10px', backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
              title="Automatically adjusted by traffic volume"
            />
          </label>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <LoadTestingPanel onTrigger={handleLoadTestTrigger} loading={loading} />
        {loadTestResult && (
          <div className="load-test-result" style={{ marginTop: '10px', color: 'blue', border: '1px solid blue', padding: '10px' }}>
            <h3>Load Test Completed!</h3>
            <p>Total Duration: {loadTestResult.totalDuration}ms</p>
            <p>Successful Requests: {loadTestResult.success}</p>
            <p>Failed Requests: {loadTestResult.errors}</p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button id="trigger-process" onClick={handleTrigger} disabled={loading} style={{ fontSize: '1.2em', padding: '10px 20px' }}>
          {loading ? 'Processing...' : 'Trigger Single Process'}
        </button>
      </div>

      {result && result.success && (
        <div className="success-message" style={{ color: 'green', border: '1px solid green', padding: '10px' }}>
          <h3>Process Completed!</h3>
          <p>Delay: {result.delay}ms</p>
          <p>Jitter: {result.jitter}ms</p>
          <p>CPU Load: {result.cpuLoad}</p>
          <p>Memory Stress: {result.memoryStress}MB</p>
          <p>Duration: {result.duration}ms</p>
        </div>
      )}

      {result && result.error && (
         <div className="error-message" style={{ color: 'red' }}>
            Error: {result.error}
         </div>
      )}
    </div>
  )
}

export default App
