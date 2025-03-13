
import React from 'react';
import CustomCard from '@/components/ui/CustomCard';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface InvoiceStats {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  revenue: number;
}

interface StatCardsProps {
  invoiceStats: InvoiceStats;
  formatCurrency: (amount: number) => string;
}

const StatCards: React.FC<StatCardsProps> = ({ invoiceStats, formatCurrency }) => {
  const navigate = useNavigate();
  
  const handleCardClick = (path: string) => {
    navigate(path);
  };
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <CustomCard 
        className={cn(
          "cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all duration-300",
          "hover:translate-y-[-2px] hover:shadow-md relative overflow-hidden"
        )}
        onClick={() => handleCardClick('/invoices')}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-apple-blue/5 rounded-full -mr-6 -mt-6"></div>
        <h3 className="text-sm font-medium text-muted-foreground">Total Invoices</h3>
        <p className="text-2xl font-semibold mt-1">{invoiceStats.total}</p>
        <div className="flex items-center mt-3 text-xs text-muted-foreground">
          <span>View all</span>
          <ChevronRight size={14} className="ml-1" />
        </div>
      </CustomCard>
      
      <CustomCard 
        className={cn(
          "cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all duration-300",
          "hover:translate-y-[-2px] hover:shadow-md relative overflow-hidden"
        )}
        onClick={() => handleCardClick('/invoices?filter=paid')}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-apple-green/5 rounded-full -mr-6 -mt-6"></div>
        <h3 className="text-sm font-medium text-muted-foreground">Paid Invoices</h3>
        <p className="text-2xl font-semibold mt-1 text-apple-green">{invoiceStats.paid}</p>
        <div className="flex items-center mt-3 text-xs text-muted-foreground">
          <span>View paid</span>
          <ChevronRight size={14} className="ml-1" />
        </div>
      </CustomCard>
      
      <CustomCard 
        className={cn(
          "cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all duration-300",
          "hover:translate-y-[-2px] hover:shadow-md relative overflow-hidden"
        )}
        onClick={() => handleCardClick('/invoices?filter=pending')}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-apple-orange/5 rounded-full -mr-6 -mt-6"></div>
        <h3 className="text-sm font-medium text-muted-foreground">Pending</h3>
        <p className="text-2xl font-semibold mt-1 text-apple-orange">{invoiceStats.pending}</p>
        <div className="flex items-center mt-3 text-xs text-muted-foreground">
          <span>View pending</span>
          <ChevronRight size={14} className="ml-1" />
        </div>
      </CustomCard>
      
      <CustomCard 
        className={cn(
          "cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all duration-300",
          "hover:translate-y-[-2px] hover:shadow-md relative overflow-hidden"
        )}
        onClick={() => handleCardClick('/invoices')}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full -mr-6 -mt-6"></div>
        <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
        <p className="text-2xl font-semibold mt-1">{formatCurrency(invoiceStats.revenue)}</p>
        <div className="flex items-center mt-3 text-xs text-muted-foreground">
          <span>View details</span>
          <ChevronRight size={14} className="ml-1" />
        </div>
      </CustomCard>
    </div>
  );
};

export default StatCards;
