import React from 'react';
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

export interface MetricPoint {
  timestamp: string;
  avgLatency: number;
  errorRate: number;
}

interface MetricsChartProps {
  data: MetricPoint[];
}

const MetricsChart: React.FC<MetricsChartProps> = ({ data }) => {
  return (
    <div style={{ width: '100%', height: 300, marginBottom: '20px' }}>
      <h3>Metrics History</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis yAxisId="left" label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'Error Rate', angle: 90, position: 'insideRight' }} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="avgLatency" stroke="#8884d8" activeDot={{ r: 8 }} name="Avg Latency" />
          <Line yAxisId="right" type="monotone" dataKey="errorRate" stroke="#82ca9d" name="Error Rate" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MetricsChart;
