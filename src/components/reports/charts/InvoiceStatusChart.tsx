
import React from 'react';
import { PieChart as PieChartIcon, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import CustomCard from '@/components/ui/CustomCard';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

interface EnhancedLegendProps {
  payload?: any[];
}

// Updated color palette for better visual appeal
const PIE_COLORS = ['#4ade80', '#f97316', '#f43f5e'];

const STATUS_ICONS = {
  'Paid': <CheckCircle2 size={16} className="text-[#4ade80]" />,
  'Pending': <Clock size={16} className="text-[#f97316]" />,
  'Overdue': <AlertCircle size={16} className="text-[#f43f5e]" />
};

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border/50 shadow-lg rounded-lg p-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.fill }}></div>
          <p className="font-semibold">{data.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Count: {data.value}</p>
          <p className="text-sm text-muted-foreground">Share: {(data.percent * 100).toFixed(1)}%</p>
        </div>
      </div>
    );
  }
  return null;
};

const EnhancedLegend = ({ payload = [] }: EnhancedLegendProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      {payload.map((entry, index) => (
        <div 
          key={`legend-${index}`} 
          className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full flex items-center justify-center" 
              style={{ backgroundColor: entry.color }}
            >
              <div className="w-2 h-2 rounded-full bg-white/70"></div>
            </div>
            <div className="flex items-center gap-1.5">
              {STATUS_ICONS[entry.value]}
              <span className="font-medium">{entry.value}</span>
            </div>
          </div>
          <span className="text-muted-foreground ml-auto font-mono">
            {entry.payload.value} ({(entry.payload.percent * 100).toFixed(0)}%)
          </span>
        </div>
      ))}
    </div>
  );
};

interface InvoiceStatusChartProps {
  data: Array<{ 
    name: string; 
    value: number; 
    fill: string; 
    percent: number;
  }>;
}

const InvoiceStatusChart: React.FC<InvoiceStatusChartProps> = ({ data }) => {
  // Don't render the chart if there's no valid data
  if (!data || data.length === 0 || data.every(item => item.value === 0)) {
    return (
      <CustomCard padding="md" variant="elevated">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieChartIcon size={18} className="text-primary" />
            <h3 className="text-lg font-medium">Invoice Status Distribution</h3>
          </div>
        </div>
        <div className="h-[480px] flex items-center justify-center">
          <p className="text-muted-foreground">No status data available</p>
        </div>
      </CustomCard>
    );
  }

  return (
    <CustomCard padding="md" variant="elevated">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PieChartIcon size={18} className="text-primary" />
          <h3 className="text-lg font-medium">Invoice Status Distribution</h3>
        </div>
      </div>
      
      <div className="h-[480px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="40%"
              labelLine={false}
              label={false}
              outerRadius={95}
              innerRadius={70}
              paddingAngle={8}
              dataKey="value"
              strokeWidth={2}
              stroke="var(--background)"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                  className="drop-shadow-lg"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              content={<EnhancedLegend />}
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </CustomCard>
  );
};

export default InvoiceStatusChart;
