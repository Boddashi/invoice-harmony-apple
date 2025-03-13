
import React from 'react';
import CustomCard from '@/components/ui/CustomCard';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
        className={cn("cursor-pointer hover:ring-1 hover:ring-primary/20 transition-transform duration-300 hover:translate-y-[-2px]")}
        onClick={() => handleCardClick('/invoices')}
      >
        <h3 className="text-sm font-medium text-muted-foreground">Total Invoices</h3>
        <p className="text-2xl font-semibold mt-1">{invoiceStats.total}</p>
      </CustomCard>
      
      <CustomCard 
        className={cn("cursor-pointer hover:ring-1 hover:ring-primary/20 transition-transform duration-300 hover:translate-y-[-2px]")}
        onClick={() => handleCardClick('/invoices?filter=paid')}
      >
        <h3 className="text-sm font-medium text-muted-foreground">Paid Invoices</h3>
        <p className="text-2xl font-semibold mt-1 text-green-500">{invoiceStats.paid}</p>
      </CustomCard>
      
      <CustomCard 
        className={cn("cursor-pointer hover:ring-1 hover:ring-primary/20 transition-transform duration-300 hover:translate-y-[-2px]")}
        onClick={() => handleCardClick('/invoices?filter=pending')}
      >
        <h3 className="text-sm font-medium text-muted-foreground">Pending</h3>
        <p className="text-2xl font-semibold mt-1 text-[#ff9269]">{invoiceStats.pending}</p>
      </CustomCard>
      
      <CustomCard 
        className={cn("cursor-pointer hover:ring-1 hover:ring-primary/20 transition-transform duration-300 hover:translate-y-[-2px]")}
        onClick={() => handleCardClick('/invoices')}
      >
        <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
        <p className="text-2xl font-semibold mt-1">{formatCurrency(invoiceStats.revenue)}</p>
      </CustomCard>
    </div>
  );
};

export default StatCards;
