
import React from 'react';
import { BarChart3 } from 'lucide-react';
import CustomCard from '@/components/ui/CustomCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface TopClientsChartProps {
  data: Array<{ name: string; amount: number }>;
  currencySymbol: string;
  formatCurrency: (amount: number) => string;
}

const TopClientsChart: React.FC<TopClientsChartProps> = ({
  data,
  currencySymbol,
  formatCurrency
}) => {
  // Don't render chart content if there's no valid data
  const hasValidData = data && data.length > 0;

  return (
    <CustomCard padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Top Clients by Revenue</h3>
        <BarChart3 size={20} className="text-muted-foreground" />
      </div>
      
      {!hasValidData ? (
        <div className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">No client revenue data available</p>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 40, bottom: 70 }}
            >
              <defs>
                <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ 
                  fill: 'var(--foreground)',
                  fontSize: 12 
                }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                tickFormatter={(value) => `${currencySymbol}${value}`}
                width={80}
                tick={{ 
                  fill: 'var(--foreground)',
                  fontSize: 12 
                }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <Tooltip 
                cursor={false}
                formatter={(value) => [`${formatCurrency(Number(value))}`, 'Revenue']}
                contentStyle={{ 
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Bar 
                dataKey="amount" 
                fill="url(#colorClients)"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </CustomCard>
  );
};

export default TopClientsChart;
