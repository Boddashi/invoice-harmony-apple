
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import InvoiceActions from './InvoiceActions';

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  amount?: number;
  total_amount: number;
  client: {
    id: string;
    name: string;
  };
}

interface InvoiceListProps {
  invoices: Invoice[];
  isLoading: boolean;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, isLoading }) => {
  const { currencySymbol } = useCurrency();
  
  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const getStatusConfig = (status: string) => {
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
      case 'draft':
      default:
        return {
          label: 'Draft',
          color: 'bg-gray-100 text-gray-600 border-gray-200',
          icon: FileText
        };
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-xl p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-xl p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">No invoices found. Create your first invoice to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-xl overflow-hidden">
      <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 text-sm font-medium">
        <div className="col-span-3">Invoice</div>
        <div className="col-span-3">Client</div>
        <div className="col-span-2">Issue Date</div>
        <div className="col-span-2">Amount</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1"></div>
      </div>
      
      {invoices.map((invoice) => {
        const status = getStatusConfig(invoice.status);
        const StatusIcon = status.icon;
        
        return (
          <div 
            key={invoice.id}
            className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-gray-50 transition-colors items-center"
          >
            <div className="col-span-3">
              <Link to={`/invoices/${invoice.id}`} className="font-medium text-apple-blue hover:underline">
                {invoice.invoice_number}
              </Link>
              <p className="text-sm text-muted-foreground">Due {formatDate(invoice.due_date)}</p>
            </div>
            
            <div className="col-span-3">
              <p className="font-medium">{invoice.client.name}</p>
            </div>
            
            <div className="col-span-2 text-sm">
              {formatDate(invoice.issue_date)}
            </div>
            
            <div className="col-span-2 font-medium">
              {formatAmount(invoice.total_amount)}
            </div>
            
            <div className="col-span-1">
              <div className={cn(
                "px-3 py-1 text-xs font-medium border rounded-full inline-flex items-center",
                status.color
              )}>
                <StatusIcon size={12} className="mr-1" />
                {status.label}
              </div>
            </div>
            
            <div className="col-span-1 text-right">
              <InvoiceActions invoiceId={invoice.id} status={invoice.status} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InvoiceList;
