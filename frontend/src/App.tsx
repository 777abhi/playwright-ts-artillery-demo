import { useState, useEffect } from 'react'
import { Config, PRESETS } from './config/presets'
import MetricsChart, { MetricPoint } from './components/MetricsChart'

interface Result extends Config {
  success?: boolean;
  duration?: number;
  error?: string;
}

interface Metrics {
  totalRequests: number;
  totalErrors: number;
  totalLatency: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  errorRate: number;
}

// Define API base URL constant for easy configuration
const API_BASE_URL = 'http://localhost:3001';

function App() {
  const [delay, setDelay] = useState<number>(0)
  const [cpuLoad, setCpuLoad] = useState<number>(0)
  const [memoryStress, setMemoryStress] = useState<number>(0)
  const [jitter, setJitter] = useState<number>(0)
  const [config, setConfig] = useState<Config>({ delay: 0, cpuLoad: 0, memoryStress: 0, jitter: 0 })
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [savedMessage, setSavedMessage] = useState<string>('')
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [metricsHistory, setMetricsHistory] = useState<MetricPoint[]>([])

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/metrics`)
        if (res.ok) {
          const data: Metrics = await res.json()
          setMetrics(data)

          setMetricsHistory(prev => {
            const now = new Date()
            const timeString = now.toLocaleTimeString([], { hour12: false })
            const newPoint: MetricPoint = {
              timestamp: timeString,
              avgLatency: data.avgLatency,
              errorRate: data.errorRate
            }
            const newHistory = [...prev, newPoint]
            if (newHistory.length > 30) {
              return newHistory.slice(newHistory.length - 30)
            }
            return newHistory
          })
        }
      } catch (err) {
        console.error('Failed to fetch metrics', err)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 2000)
    return () => clearInterval(interval)
  }, [])

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

  const handleTrigger = async () => {
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch(`${API_BASE_URL}/process?delay=${config.delay}&cpuLoad=${config.cpuLoad}&memoryStress=${config.memoryStress}&jitter=${config.jitter}`)
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
    try {
      await fetch(`${API_BASE_URL}/metrics`, { method: 'DELETE' })
      setMetrics(prev => prev ? { ...prev, totalRequests: 0, totalErrors: 0, totalLatency: 0, avgLatency: 0, minLatency: 0, maxLatency: 0, errorRate: 0 } : null)
      setMetricsHistory([])
    } catch (error) {
      console.error('Failed to reset metrics', error)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Performance Simulation</h1>

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
          {Object.entries(PRESETS).map(([name, config]) => (
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

      <div style={{ marginBottom: '20px' }}>
        <button id="trigger-process" onClick={handleTrigger} disabled={loading} style={{ fontSize: '1.2em', padding: '10px 20px' }}>
          {loading ? 'Processing...' : 'Trigger Process'}
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
