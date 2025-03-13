
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
      period: isMobile && item.period.length > 6 ? 
        `${item.period.substring(0, 4)}...` : item.period
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

  return (
    <CustomCard padding="md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Revenue</h3>
          <BarChart3 size={20} className="text-muted-foreground hidden sm:block" />
        </div>
        <Select 
          value={selectedPeriod} 
          onValueChange={(value: TimePeriod) => onPeriodChange(value)}
        >
          <SelectTrigger className="w-[120px] h-8">
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
        <div className="h-40 flex items-center justify-center">
          <p className="text-muted-foreground">No revenue data available</p>
        </div>
      ) : (
        <div className="w-full h-[180px] sm:h-[240px]">
          <ChartContainer 
            config={chartConfig}
            className="w-full h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={isMobile 
                  ? { top: 5, right: 5, left: 0, bottom: 20 } 
                  : { top: 10, right: 30, left: 40, bottom: 35 }
                }
                barSize={isMobile ? 12 : 30}
                barGap={2}
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
                  opacity={0.5}
                />
                <XAxis
                  dataKey="period"
                  angle={isMobile ? -45 : -45}
                  textAnchor="end"
                  height={isMobile ? 30 : 45}
                  interval={isMobile ? 1 : 0}
                  tick={{ 
                    fill: 'hsl(var(--foreground))',
                    fontSize: isMobile ? 9 : 12 
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
                  width={isMobile ? 40 : 80}
                  tick={{ 
                    fill: 'hsl(var(--foreground))',
                    fontSize: isMobile ? 9 : 12 
                  }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={{ stroke: 'var(--border)' }}
                  tickCount={isMobile ? 4 : 6}
                />
                <ChartTooltip
                  cursor={{ fill: 'var(--primary-light)', opacity: 0.1 }}
                  content={
                    <ChartTooltipContent 
                      formatter={(value) => [`${formatCurrency(Number(value))}`, 'Revenue']}
                      labelFormatter={(label) => 
                        isMobile && label.includes('...') 
                          ? data.find(item => item.period.startsWith(label.substring(0, 4)))?.period || label
                          : label
                      }
                    />
                  }
                />
                <Bar 
                  dataKey="amount" 
                  fill="url(#colorRevenue)"
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
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
