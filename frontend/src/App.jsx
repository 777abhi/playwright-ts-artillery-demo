import React, { useState } from 'react'

function App() {
  const [delay, setDelay] = useState(0)
  const [cpuLoad, setCpuLoad] = useState(0)
  const [memoryStress, setMemoryStress] = useState(0)
  const [config, setConfig] = useState({ delay: 0, cpuLoad: 0, memoryStress: 0 })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  const handleSave = () => {
    setConfig({ delay, cpuLoad, memoryStress })
    setSavedMessage('Settings saved!')
    setTimeout(() => setSavedMessage(''), 2000)
  }

  const handleTrigger = async () => {
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch(`http://localhost:3001/process?delay=${config.delay}&cpuLoad=${config.cpuLoad}&memoryStress=${config.memoryStress}`)
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error(error)
      setResult({ error: 'Failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Performance Simulation</h1>

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
