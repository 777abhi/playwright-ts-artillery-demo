import React, { useState } from 'react';

interface LoadTestingPanelProps {
  onTrigger: (concurrentUsers: number, iterations: number) => void;
  loading: boolean;
}

const LoadTestingPanel: React.FC<LoadTestingPanelProps> = ({ onTrigger, loading }) => {
  const [concurrentUsers, setConcurrentUsers] = useState(1);
  const [iterations, setIterations] = useState(1);

  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
      <h2>Advanced Load Testing</h2>
      <div style={{ marginBottom: '10px' }}>
        <label>
          Concurrent Users:
          <input
            id="concurrent-users-input"
            type="number"
            min="1"
            value={concurrentUsers}
            onChange={(e) => setConcurrentUsers(Number(e.target.value))}
            style={{ marginLeft: '10px' }}
          />
        </label>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>
          Iterations per User:
          <input
            id="iterations-input"
            type="number"
            min="1"
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
            style={{ marginLeft: '10px' }}
          />
        </label>
      </div>
      <button
        id="trigger-load-test"
        onClick={() => onTrigger(concurrentUsers, iterations)}
        disabled={loading}
      >
        {loading ? 'Running Load Test...' : 'Trigger Load Test'}
      </button>
    </div>
  );
};

export default LoadTestingPanel;
