import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MetricPoint } from './MetricsChart';

interface LongTermMetricsProps {
  apiBaseUrl: string;
}

const LongTermMetrics: React.FC<LongTermMetricsProps> = ({ apiBaseUrl }) => {
  const [data, setData] = useState<MetricPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('24h');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');

    let hours = 24;
    if (timeRange === '7d') hours = 24 * 7;
    if (timeRange === '30d') hours = 24 * 30;

    const endTime = Date.now();
    const startTime = endTime - hours * 60 * 60 * 1000;

    try {
      const response = await fetch(`${apiBaseUrl}/metrics/history/long-term?startTime=${startTime}&endTime=${endTime}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();

      const formattedData = json.metrics.map((point: any) => ({
        ...point,
        timestamp: new Date(point.timestamp).toLocaleTimeString()
      }));

      setData(formattedData);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch long-term metrics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px', background: '#f9f9f9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: 0 }}>Long-Term Metrics History</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)} style={{ padding: '5px' }}>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={fetchHistory}
            disabled={loading}
            style={{ padding: '5px 10px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Fetching...' : 'Fetch History'}
          </button>
        </div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      {data.length > 0 ? (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis yAxisId="left" label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Error Rate', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="avgLatency" stroke="#8884d8" activeDot={{ r: 8 }} name="Avg Latency" />
              <Line yAxisId="left" type="monotone" dataKey="p95Latency" stroke="#ff7300" name="P95 Latency" />
              <Line yAxisId="right" type="monotone" dataKey="errorRate" stroke="#82ca9d" name="Error Rate" />
              <Line yAxisId="right" type="monotone" dataKey="requests" stroke="#00C49F" name="Requests" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          {loading ? 'Loading data...' : 'Click "Fetch History" to load long-term metrics'}
        </div>
      )}
    </div>
  );
};

export default LongTermMetrics;
