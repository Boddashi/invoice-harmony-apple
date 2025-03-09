
import React from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import CustomCard from '../ui/CustomCard';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

const DashboardSummary = () => {
  const { currencySymbol } = useCurrency();
  
  // Format amount with currency symbol
  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };
  
  // Mock data
  const summaryData = [
    { 
      title: 'Total Revenue', 
      amount: 12456, 
      change: '+12.5%', 
      isPositive: true,
      icon: DollarSign,
      color: 'bg-apple-green/10 text-apple-green'
    },
    { 
      title: 'Pending Invoices', 
      amount: 3245, 
      change: '4 invoices', 
      isPositive: false,
      icon: Clock,
      color: 'bg-apple-orange/10 text-apple-orange'
    },
    { 
      title: 'Paid Invoices', 
      amount: 9211, 
      change: '12 invoices', 
      isPositive: true,
      icon: CheckCircle,
      color: 'bg-apple-blue/10 text-apple-blue'
    },
    { 
      title: 'Overdue Invoices', 
      amount: 1350, 
      change: '2 invoices', 
      isPositive: false,
      icon: AlertCircle,
      color: 'bg-apple-red/10 text-apple-red'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-slide-up">
      {summaryData.map((item, index) => {
        const Icon = item.icon;
        
        return (
          <CustomCard 
            key={index} 
            className="transition-transform duration-300 hover:translate-y-[-2px]"
          >
            <div className="flex items-start justify-between">
              <div className={cn("p-2 rounded-lg", item.color)}>
                <Icon size={20} />
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className={cn(
                  item.isPositive ? 'text-apple-green' : 'text-apple-red'
                )}>
                  {item.change}
                </span>
                {item.isPositive ? (
                  <ArrowUpRight size={16} className="text-apple-green" />
                ) : (
                  <ArrowDownRight size={16} className="text-apple-red" />
                )}
              </div>
            </div>
            
            <div className="mt-3">
              <h3 className="text-sm font-medium text-muted-foreground">{item.title}</h3>
              <p className="text-2xl font-semibold mt-1">{formatAmount(item.amount)}</p>
            </div>
          </CustomCard>
        );
      })}
    </div>
  );
};

export default DashboardSummary;
