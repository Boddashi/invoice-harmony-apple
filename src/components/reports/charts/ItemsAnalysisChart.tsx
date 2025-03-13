
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
}

const ItemsAnalysisChart: React.FC<ItemsAnalysisChartProps> = ({
  data,
  currencySymbol,
  formatCurrency
}) => {
  const isMobile = useIsMobile();
  
  // Customize the data for mobile to shorten long names
  const chartData = React.useMemo(() => {
    return data.map(item => ({
      ...item,
      // Truncate long names on mobile
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

  return (
    <CustomCard padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Selected Items Revenue Analysis</h3>
        <BarChart3 size={20} className="text-muted-foreground" />
      </div>
      
      <div className={`${isMobile ? 'h-60' : 'h-80'}`}>
        <ChartContainer 
          config={chartConfig}
          className="w-full h-full"
        >
          <BarChart
            data={chartData}
            margin={isMobile 
              ? { top: 20, right: 10, left: 10, bottom: 60 } 
              : { top: 20, right: 30, left: 40, bottom: 70 }
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
              height={isMobile ? 70 : 70}
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
                    if (name === 'amount') return [`${formatCurrency(Number(value))}`, 'Revenue'];
                    if (name === 'count') return [value, 'Units Sold'];
                    return [value, name];
                  }}
                />
              }
              cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
            />
            <Bar 
              dataKey="amount" 
              fill="url(#colorItems)"
              radius={[4, 4, 0, 0]}
              maxBarSize={isMobile ? 30 : 50}
              name="Revenue"
              className="cursor-pointer"
              onMouseOver={(data, index) => {
                document.querySelectorAll('.recharts-bar-rectangle').forEach((elem, i) => {
                  if (i === index) {
                    (elem as HTMLElement).style.fill = 'url(#colorItemsHover)';
                    (elem as HTMLElement).style.filter = 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.3))';
                    (elem as HTMLElement).style.transition = 'all 0.2s ease';
                  }
                });
              }}
              onMouseOut={(data, index) => {
                document.querySelectorAll('.recharts-bar-rectangle').forEach((elem, i) => {
                  if (i === index) {
                    (elem as HTMLElement).style.fill = 'url(#colorItems)';
                    (elem as HTMLElement).style.filter = 'none';
                  }
                });
              }}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </CustomCard>
  );
};

export default ItemsAnalysisChart;
