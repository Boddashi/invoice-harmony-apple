
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

interface MonthlyRevenueChartProps {
  data: Array<{ month: string; amount: number }>;
  currencySymbol: string;
  formatCurrency: (amount: number) => string;
}

const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({ 
  data, 
  currencySymbol,
  formatCurrency
}) => {
  // Ensure we have data to display
  const chartData = data && data.length > 0 ? data : [];
  
  return (
    <CustomCard padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Monthly Revenue</h3>
        <BarChart3 size={20} className="text-muted-foreground" />
      </div>
      
      <div className="h-80">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No revenue data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 40, bottom: 70 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke="var(--border)"
              />
              <XAxis
                dataKey="month"
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ 
                  fill: 'var(--muted-foreground)',
                  fontSize: 12 
                }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                tickFormatter={(value) => `${currencySymbol}${value}`}
                width={80}
                tick={{ 
                  fill: 'var(--muted-foreground)',
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
                fill="url(#colorRevenue)"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </CustomCard>
  );
};

export default MonthlyRevenueChart;
