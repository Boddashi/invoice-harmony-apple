
import React from 'react';
import { BarChart3 } from 'lucide-react';
import CustomCard from '@/components/ui/CustomCard';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

interface TopClientsChartProps {
  data: Array<{ name: string; amount: number }>;
  currencySymbol: string;
  formatCurrency: (amount: number) => string;
  reportSource?: 'invoices' | 'credit-notes'; // Adding reportSource prop
}

const TopClientsChart: React.FC<TopClientsChartProps> = ({
  data,
  currencySymbol,
  formatCurrency,
  reportSource = 'invoices'
}) => {
  const isMobile = useIsMobile();
  const hasValidData = data && data.length > 0;
  
  const chartData = React.useMemo(() => {
    return data.map(item => ({
      ...item,
      name: isMobile && item.name.length > 10 ? 
        `${item.name.substring(0, 8)}...` : item.name
    }));
  }, [data, isMobile]);
  
  const chartConfig = {
    revenue: {
      label: "Revenue",
      theme: {
        light: "#0EA5E9",
        dark: "#0EA5E9"
      }
    }
  };

  const title = reportSource === 'invoices' ? 'Top Clients by Revenue' : 'Top Clients by Credit';

  return (
    <CustomCard padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">{title}</h3>
        <BarChart3 size={20} className="text-muted-foreground" />
      </div>
      
      {!hasValidData ? (
        <div className="h-40 flex items-center justify-center">
          <p className="text-muted-foreground">No client revenue data available</p>
        </div>
      ) : (
        <div className={`${isMobile ? 'h-40' : 'h-60'} w-full`}>
          <ChartContainer 
            config={chartConfig}
            className="w-full h-full"
          >
            <BarChart
              data={chartData}
              margin={isMobile 
                ? { top: 5, right: 10, left: 10, bottom: 30 } 
                : { top: 10, right: 30, left: 40, bottom: 35 }
              }
            >
              <defs>
                <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorClientsHover" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="name"
                angle={isMobile ? -65 : -45}
                textAnchor="end"
                height={isMobile ? 40 : 45}
                interval={0}
                tick={{ 
                  fill: 'hsl(var(--foreground))',
                  fontSize: isMobile ? 10 : 12 
                }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                tickFormatter={(value) => 
                  isMobile 
                    ? `${currencySymbol}${Math.round(value)}`
                    : `${currencySymbol}${value}`
                }
                width={isMobile ? 50 : 80}
                tick={{ 
                  fill: 'hsl(var(--foreground))',
                  fontSize: isMobile ? 10 : 12 
                }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent 
                    formatter={(value) => [`${formatCurrency(Number(value))}`, reportSource === 'invoices' ? ' Revenue' : ' Credit']}
                  />
                }
              />
              <Bar 
                dataKey="amount" 
                fill="url(#colorClients)"
                radius={[4, 4, 0, 0]}
                maxBarSize={isMobile ? 30 : 50}
              />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </CustomCard>
  );
};

export default TopClientsChart;
