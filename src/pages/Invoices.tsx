import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import CustomCard from '../components/ui/CustomCard';
import { Check, ChevronDown, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import InvoiceActions from '@/components/invoices/InvoiceActions';

type InvoiceStatus = 'all' | 'draft' | 'pending' | 'paid' | 'overdue';
type InvoiceDBStatus = 'draft' | 'pending' | 'paid' | 'overdue';

interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: InvoiceDBStatus;
  amount: number;
  tax_rate?: number;
  tax_amount?: number;
  total_amount: number;
  notes?: string;
  client?: {
    name: string;
  };
}

const Invoices = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<InvoiceStatus>('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { currencySymbol } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            client:clients(name)
          `)
          .eq('user_id', user.id);
        
        if (error) {
          throw error;
        }
        
        const typedData = data?.map(invoice => ({
          ...invoice,
          status: invoice.status as InvoiceDBStatus
        })) || [];
        
        setInvoices(typedData);
      } catch (error: any) {
        console.error('Error fetching invoices:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch invoices."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoices();
  }, [user, toast]);
  
  const filteredInvoices = invoices
    .filter(invoice => filter === 'all' || invoice.status === filter)
    .filter(invoice => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        invoice.invoice_number.toLowerCase().includes(query) ||
        (invoice.client?.name && invoice.client.name.toLowerCase().includes(query)) ||
        formatDate(invoice.issue_date).toLowerCase().includes(query) ||
        formatDate(invoice.due_date).toLowerCase().includes(query) ||
        invoice.total_amount.toString().includes(query)
      );
    });
  
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
      <div className="w-full max-w-6xl mx-auto px-2 md:px-0 space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-in">
          <h2 className="text-xl font-semibold">Your Invoices</h2>
          <button 
            className="apple-button flex items-center gap-2 w-full sm:w-auto"
            onClick={() => navigate('/invoices/new')}
          >
            <Plus size={18} />
            <span>New Invoice</span>
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search invoices..."
              className="input-field w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex overflow-x-auto pb-1 -mx-2 px-2 md:mx-0 md:px-0 scrollbar-none">
            <div className="flex gap-2 min-w-max">
              <button 
                onClick={() => setFilter('all')} 
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                  filter === 'all' ? 'bg-apple-blue text-white' : 'hover:bg-secondary'
                )}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('draft')} 
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                  filter === 'draft' ? 'bg-apple-blue text-white' : 'hover:bg-secondary'
                )}
              >
                Draft
              </button>
              <button 
                onClick={() => setFilter('pending')} 
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                  filter === 'pending' ? 'bg-apple-blue text-white' : 'hover:bg-secondary'
                )}
              >
                Pending
              </button>
              <button 
                onClick={() => setFilter('paid')} 
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                  filter === 'paid' ? 'bg-apple-blue text-white' : 'hover:bg-secondary'
                )}
              >
                Paid
              </button>
              <button 
                onClick={() => setFilter('overdue')} 
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                  filter === 'overdue' ? 'bg-apple-blue text-white' : 'hover:bg-secondary'
                )}
              >
                Overdue
              </button>
            </div>
          </div>
        </div>
        
        <CustomCard padding="none" className="animate-fade-in w-full overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery.trim() 
                  ? "No invoices match your search. Try a different search term." 
                  : "No invoices found. Create your first invoice to get started."}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="w-full min-w-full table-fixed">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="py-3 px-4 text-left font-medium">
                        <div className="flex items-center gap-1">
                          Invoice #
                          <ChevronDown size={16} />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left font-medium">Client</th>
                      <th className="py-3 px-4 text-left font-medium">Issue Date</th>
                      <th className="py-3 px-4 text-left font-medium">Due Date</th>
                      <th className="py-3 px-4 text-right font-medium">Amount</th>
                      <th className="py-3 px-4 text-center font-medium">Status</th>
                      <th className="py-3 px-4 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <tr 
                        key={invoice.id} 
                        className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                      >
                        <td className="py-3 px-4 font-medium">{invoice.invoice_number}</td>
                        <td className="py-3 px-4">
                          {invoice.client ? (
                            <div>
                              <span>{invoice.client.name}</span>
                            </div>
                          ) : (
                            "Unknown Client"
                          )}
                        </td>
                        <td className="py-3 px-4">{formatDate(invoice.issue_date)}</td>
                        <td className="py-3 px-4">{formatDate(invoice.due_date)}</td>
                        <td className="py-3 px-4 text-right font-medium">{formatAmount(invoice.total_amount)}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center">
                            <span className={cn(
                              "px-3 py-1 text-xs font-medium border rounded-full",
                              getStatusColor(invoice.status)
                            )}>
                              {getStatusLabel(invoice.status)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                            <InvoiceActions invoiceId={invoice.id} status={invoice.status} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-border">
                {filteredInvoices.map((invoice) => (
                  <div 
                    key={invoice.id} 
                    className="p-4 hover:bg-secondary/30 transition-colors active:bg-secondary/50"
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="mr-2 flex-1">
                        <h3 className="font-medium truncate">{invoice.invoice_number}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {invoice.client?.name || "Unknown Client"}
                        </p>
                      </div>
                      <span className={cn(
                        "px-2.5 py-0.5 text-xs font-medium border rounded-full shrink-0",
                        getStatusColor(invoice.status)
                      )}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-1 text-sm mb-3">
                      <div className="text-muted-foreground">Issue Date:</div>
                      <div className="text-right truncate">{formatDate(invoice.issue_date)}</div>
                      
                      <div className="text-muted-foreground">Due Date:</div>
                      <div className="text-right truncate">{formatDate(invoice.due_date)}</div>
                      
                      <div className="text-muted-foreground">Amount:</div>
                      <div className="text-right font-medium">{formatAmount(invoice.total_amount)}</div>
                    </div>
                    
                    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                      <InvoiceActions invoiceId={invoice.id} status={invoice.status} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CustomCard>
      </div>
    </MainLayout>
  );
};

export default Invoices;
