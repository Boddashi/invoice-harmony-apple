
import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
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
      period: isMobile && item.period.length > 10 ? 
        `${item.period.substring(0, 8)}...` : item.period
    }));
  }, [data, isMobile]);
  
  const chartConfig = {
    revenue: {
      label: "Revenue",
      theme: {
        light: "#8B5CF6",
        dark: "#8B5CF6"
      }
    }
  };

  // Helper function to format Y-axis values
  const formatYAxisTick = (value: number) => {
    if (isMobile) {
      if (value >= 1000) {
        return `${currencySymbol}${Math.floor(value / 1000)}k`;
      }
      return `${currencySymbol}${Math.round(value)}`;
    }
    return `${currencySymbol}${value}`;
  };

  return (
    <CustomCard padding="md" className="overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex flex-row items-center gap-2">
          <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
            <TrendingUp size={18} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-medium">Revenue</h3>
        </div>
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <Select value={selectedPeriod} onValueChange={(value: TimePeriod) => onPeriodChange(value)}>
            <SelectTrigger className="w-[120px] bg-background">
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
          <BarChart3 size={20} className="text-muted-foreground hidden sm:block" />
        </div>
      </div>
      
      {!hasValidData ? (
        <div className="h-40 flex items-center justify-center">
          <p className="text-muted-foreground">No revenue data available</p>
        </div>
      ) : (
        <div className={`${isMobile ? 'h-48' : 'h-64'} w-full`}>
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
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorRevenueHover" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A78BFA" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.3}/>
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
                tickFormatter={formatYAxisTick}
                width={isMobile ? 50 : 80}
                tick={{ 
                  fill: 'hsl(var(--foreground))',
                  fontSize: isMobile ? 10 : 12 
                }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <ChartTooltip
                cursor={{fill: 'var(--muted)'}}
                content={
                  <ChartTooltipContent 
                    formatter={(value) => [`${formatCurrency(Number(value))}`, 'Revenue']}
                  />
                }
              />
              <Bar 
                dataKey="amount" 
                fill="url(#colorRevenue)"
                radius={[4, 4, 0, 0]}
                maxBarSize={isMobile ? 30 : 50}
                animationDuration={1500}
                className="cursor-pointer hover:fill-purple-400 transition-colors duration-300"
              />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </CustomCard>
  );
};

export default RevenueChart;
