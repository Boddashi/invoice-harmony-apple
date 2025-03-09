
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import CustomCard from '../ui/CustomCard';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

type InvoiceStatus = 'paid' | 'pending' | 'overdue';

interface Invoice {
  id: string;
  client: string;
  amount: number;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
}

const getStatusConfig = (status: InvoiceStatus) => {
  switch (status) {
    case 'paid':
      return {
        label: 'Paid',
        color: 'bg-apple-green/10 text-apple-green border-apple-green/20',
        icon: CheckCircle
      };
    case 'pending':
      return {
        label: 'Pending',
        color: 'bg-apple-orange/10 text-apple-orange border-apple-orange/20',
        icon: Clock
      };
    case 'overdue':
      return {
        label: 'Overdue',
        color: 'bg-apple-red/10 text-apple-red border-apple-red/20',
        icon: AlertCircle
      };
  }
};

const InvoiceList = () => {
  const { currencySymbol } = useCurrency();
  
  // Mock data
  const recentInvoices: Invoice[] = [
    {
      id: 'INV-001',
      client: 'Apple Inc.',
      amount: 3250.00,
      date: 'June 15, 2023',
      dueDate: 'July 15, 2023',
      status: 'paid'
    },
    {
      id: 'INV-002',
      client: 'Microsoft Corp.',
      amount: 1840.00,
      date: 'June 25, 2023',
      dueDate: 'July 25, 2023',
      status: 'pending'
    },
    {
      id: 'INV-003',
      client: 'Google LLC',
      amount: 5600.00,
      date: 'June 28, 2023',
      dueDate: 'July 5, 2023',
      status: 'overdue'
    },
    {
      id: 'INV-004',
      client: 'Amazon.com Inc.',
      amount: 2100.00,
      date: 'July 2, 2023',
      dueDate: 'August 2, 2023',
      status: 'pending'
    },
    {
      id: 'INV-005',
      client: 'Tesla Inc.',
      amount: 4530.00,
      date: 'July 5, 2023',
      dueDate: 'August 5, 2023',
      status: 'paid'
    }
  ];

  // Format amount with currency symbol
  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  return (
    <CustomCard className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recent Invoices</h2>
        <Link to="/invoices" className="text-apple-blue flex items-center text-sm hover:underline">
          View all <ArrowRight size={16} className="ml-1" />
        </Link>
      </div>
      
      <div className="space-y-4">
        {recentInvoices.map((invoice) => {
          const status = getStatusConfig(invoice.status);
          const StatusIcon = status.icon;
          
          return (
            <Link 
              key={invoice.id} 
              to={`/invoices/${invoice.id}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  status.color
                )}>
                  <StatusIcon size={18} />
                </div>
                
                <div>
                  <h3 className="font-medium">{invoice.client}</h3>
                  <p className="text-sm text-muted-foreground">{invoice.id} • {invoice.date}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold">{formatAmount(invoice.amount)}</p>
                  <p className="text-sm text-muted-foreground">Due {invoice.dueDate}</p>
                </div>
                
                <div className={cn(
                  "px-3 py-1 text-xs font-medium border rounded-full",
                  status.color
                )}>
                  {status.label}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </CustomCard>
  );
};

export default InvoiceList;
