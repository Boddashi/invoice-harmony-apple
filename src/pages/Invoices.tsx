
import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import CustomCard from '../components/ui/CustomCard';
import { Check, ChevronDown, Download, Eye, MoreHorizontal, Search, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

type InvoiceStatus = 'all' | 'draft' | 'pending' | 'paid' | 'overdue';

interface Invoice {
  id: string;
  client: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
}

const Invoices = () => {
  const [filter, setFilter] = useState<InvoiceStatus>('all');
  const { currencySymbol } = useCurrency();
  
  // Format amount with currency symbol
  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };
  
  // Mock data
  const invoices: Invoice[] = [
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
    },
    {
      id: 'INV-006',
      client: 'Facebook, Inc.',
      amount: 2750.00,
      date: 'July 10, 2023',
      dueDate: 'August 10, 2023',
      status: 'draft'
    },
    {
      id: 'INV-007',
      client: 'Netflix, Inc.',
      amount: 3100.00,
      date: 'July 12, 2023',
      dueDate: 'August 12, 2023',
      status: 'pending'
    },
    {
      id: 'INV-008',
      client: 'Oracle Corporation',
      amount: 5250.00,
      date: 'July 15, 2023',
      dueDate: 'August 15, 2023',
      status: 'overdue'
    }
  ];
  
  const filteredInvoices = filter === 'all' 
    ? invoices 
    : invoices.filter(invoice => invoice.status === filter);
  
  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'pending':
        return 'bg-apple-orange/10 text-apple-orange border-apple-orange/20';
      case 'paid':
        return 'bg-apple-green/10 text-apple-green border-apple-green/20';
      case 'overdue':
        return 'bg-apple-red/10 text-apple-red border-apple-red/20';
    }
  };
  
  const getStatusLabel = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'pending': return 'Pending';
      case 'paid': return 'Paid';
      case 'overdue': return 'Overdue';
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search invoices..."
              className="input-field w-full pl-10"
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => setFilter('all')} 
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                filter === 'all' ? 'bg-apple-blue text-white' : 'hover:bg-secondary'
              )}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('draft')} 
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                filter === 'draft' ? 'bg-apple-blue text-white' : 'hover:bg-secondary'
              )}
            >
              Draft
            </button>
            <button 
              onClick={() => setFilter('pending')} 
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                filter === 'pending' ? 'bg-apple-blue text-white' : 'hover:bg-secondary'
              )}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilter('paid')} 
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                filter === 'paid' ? 'bg-apple-blue text-white' : 'hover:bg-secondary'
              )}
            >
              Paid
            </button>
            <button 
              onClick={() => setFilter('overdue')} 
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                filter === 'overdue' ? 'bg-apple-blue text-white' : 'hover:bg-secondary'
              )}
            >
              Overdue
            </button>
          </div>
        </div>
        
        <CustomCard padding="none" className="animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="py-4 px-5 text-left font-medium">
                    <div className="flex items-center gap-1">
                      Invoice #
                      <ChevronDown size={16} />
                    </div>
                  </th>
                  <th className="py-4 px-5 text-left font-medium">Client</th>
                  <th className="py-4 px-5 text-left font-medium">Date</th>
                  <th className="py-4 px-5 text-left font-medium">Due Date</th>
                  <th className="py-4 px-5 text-right font-medium">Amount</th>
                  <th className="py-4 px-5 text-center font-medium">Status</th>
                  <th className="py-4 px-5 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="py-4 px-5 font-medium">{invoice.id}</td>
                    <td className="py-4 px-5">{invoice.client}</td>
                    <td className="py-4 px-5">{invoice.date}</td>
                    <td className="py-4 px-5">{invoice.dueDate}</td>
                    <td className="py-4 px-5 text-right font-medium">{formatAmount(invoice.amount)}</td>
                    <td className="py-4 px-5">
                      <div className="flex justify-center">
                        <span className={cn(
                          "px-3 py-1 text-xs font-medium border rounded-full",
                          getStatusColor(invoice.status)
                        )}>
                          {getStatusLabel(invoice.status)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex justify-center gap-2">
                        <button className="p-2 rounded-full hover:bg-secondary transition-colors" title="View">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 rounded-full hover:bg-secondary transition-colors" title="Send">
                          <Send size={18} />
                        </button>
                        <button className="p-2 rounded-full hover:bg-secondary transition-colors" title="Download">
                          <Download size={18} />
                        </button>
                        <button className="p-2 rounded-full hover:bg-secondary transition-colors" title="More">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CustomCard>
      </div>
    </MainLayout>
  );
};

export default Invoices;
