
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface RevenueChartProps {
  data: Array<{ period: string; amount: number }>;
  currencySymbol: string;
  formatCurrency: (amount: number) => string;
  onPeriodChange: (period: TimePeriod) => void;
  selectedPeriod: TimePeriod;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ 
  data, 
  currencySymbol,
  formatCurrency,
  onPeriodChange,
  selectedPeriod
}) => {
  const isMobile = useIsMobile();
  const hasValidData = data && data.length > 0;
  
  const chartData = React.useMemo(() => {
    return data.map(item => ({
      ...item,
      period: isMobile && item.period.length > 4 
        ? item.period.substring(0, 3)  // Use first 3 chars for mobile
        : item.period
    }));
  }, [data, isMobile]);
  
  // Different bar color gradients for light/dark mode
  const gradientId = "revenueGradient";
  
  return (
    <CustomCard padding="md" className="flex flex-col h-full">
      <div className="flex flex-col space-y-2 xs:space-y-0 xs:flex-row xs:items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-purple-500" />
          <h3 className="text-lg font-medium">Revenue Overview</h3>
        </div>
        <Select 
          value={selectedPeriod} 
          onValueChange={(value: TimePeriod) => onPeriodChange(value)}
        >
          <SelectTrigger className="w-[120px] h-8 self-start xs:self-auto">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      {!hasValidData ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 size={40} className="mx-auto text-muted-foreground opacity-40 mb-2" />
            <p className="text-muted-foreground">No revenue data available</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full min-h-[180px]">
          <ChartContainer className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={isMobile 
                  ? { top: 5, right: 5, left: 0, bottom: 5 } 
                  : { top: 10, right: 10, left: 0, bottom: 20 }
                }
                barSize={isMobile ? 12 : 24}
                barGap={4}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#C4B5FD" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false}
                  stroke="var(--border)"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="period"
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  height={isMobile ? 40 : 30}
                  tick={{ 
                    fill: 'hsl(var(--foreground))',
                    fontSize: isMobile ? 10 : 12,
                    dy: isMobile ? 5 : 0
                  }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={{ stroke: 'var(--border)' }}
                />
                <YAxis
                  tickFormatter={(value) => {
                    if (isMobile) {
                      if (value >= 1000) {
                        return `${currencySymbol}${Math.round(value/1000)}k`;
                      }
                      return `${currencySymbol}${value}`;
                    }
                    return `${currencySymbol}${value}`;
                  }}
                  width={isMobile ? 45 : 60}
                  tick={{ 
                    fill: 'hsl(var(--foreground))',
                    fontSize: isMobile ? 10 : 12 
                  }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={{ stroke: 'var(--border)' }}
                  tickCount={isMobile ? 3 : 5}
                />
                <ChartTooltip
                  cursor={{ 
                    fill: 'hsl(var(--primary))', 
                    opacity: 0.05,
                    rx: 4,
                    ry: 4
                  }}
                  content={
                    <ChartTooltipContent 
                      formatter={(value) => [`${formatCurrency(Number(value))}`, 'Revenue']}
                      labelFormatter={(label) => {
                        // Find the original full period name if we're on mobile and have shortened it
                        if (isMobile && label.length <= 3) {
                          const originalItem = data.find(item => item.period.startsWith(label));
                          return originalItem ? originalItem.period : label;
                        }
                        return label;
                      }}
                    />
                  }
                />
                <Bar 
                  dataKey="amount" 
                  fill={`url(#${gradientId})`}
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                  className="hover:opacity-80 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}
    </CustomCard>
  );
};

export default RevenueChart;
