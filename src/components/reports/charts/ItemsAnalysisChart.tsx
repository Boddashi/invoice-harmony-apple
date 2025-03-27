
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

interface ItemsAnalysisChartProps {
  data: Array<{ 
    name: string; 
    amount: number;
    count: number;
  }>;
  currencySymbol: string;
  formatCurrency: (amount: number) => string;
  reportSource?: 'invoices' | 'credit-notes'; // Adding reportSource prop
}

const ItemsAnalysisChart: React.FC<ItemsAnalysisChartProps> = ({
  data,
  currencySymbol,
  formatCurrency,
  reportSource = 'invoices'
}) => {
  const isMobile = useIsMobile();
  
  const chartData = React.useMemo(() => {
    return data.map(item => ({
      ...item,
      name: isMobile && item.name.length > 12 ? 
        `${item.name.substring(0, 10)}...` : item.name
    }));
  }, [data, isMobile]);
  
  const chartConfig = {
    revenue: {
      label: "Revenue",
      theme: {
        light: "#10B981",
        dark: "#10B981"
      }
    }
  };

  const title = `Selected Items ${reportSource === 'invoices' ? 'Revenue' : 'Credit'} Analysis`;

  return (
    <CustomCard padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">{title}</h3>
        <BarChart3 size={20} className="text-muted-foreground" />
      </div>
      
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
              <linearGradient id="colorItems" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorItemsHover" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34D399" stopOpacity={1}/>
                <stop offset="95%" stopColor="#34D399" stopOpacity={0.3}/>
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
                fontSize: isMobile ? 10 : 12,
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
                  formatter={(value, name) => {
                    if (name === 'amount') return [`${formatCurrency(Number(value))}`, reportSource === 'invoices' ? ' Revenue' : ' Credit'];
                    if (name === 'count') return [value, ' Units Sold'];
                    return [value, name];
                  }}
                />
              }
            />
            <Bar 
              dataKey="amount" 
              fill="url(#colorItems)"
              radius={[4, 4, 0, 0]}
              maxBarSize={isMobile ? 30 : 50}
              name={reportSource === 'invoices' ? "Revenue" : "Credit"}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </CustomCard>
  );
};

export default ItemsAnalysisChart;
