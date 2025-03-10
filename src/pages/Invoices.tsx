
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import CustomCard from '../components/ui/CustomCard';
import { Check, ChevronDown, Download, Edit, Eye, MoreHorizontal, Plus, Search, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
    company: string | null;
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
  
  // Format amount with currency symbol
  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Fetch invoices from Supabase
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            client:clients(name, company)
          `)
          .eq('user_id', user.id);
        
        if (error) {
          throw error;
        }
        
        // Cast the data to ensure status is treated as InvoiceDBStatus type
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
  
  // Filter invoices based on status filter and search query
  const filteredInvoices = invoices
    .filter(invoice => filter === 'all' || invoice.status === filter)
    .filter(invoice => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        invoice.invoice_number.toLowerCase().includes(query) ||
        (invoice.client?.name && invoice.client.name.toLowerCase().includes(query)) ||
        (invoice.client?.company && invoice.client.company.toLowerCase().includes(query)) ||
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center animate-fade-in">
          <h2 className="text-xl font-semibold">Your Invoices</h2>
          <button 
            className="apple-button flex items-center gap-2"
            onClick={() => navigate('/invoices/new')}
          >
            <Plus size={18} />
            <span>New Invoice</span>
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search invoices..."
              className="input-field w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                    <th className="py-4 px-5 text-left font-medium">Issue Date</th>
                    <th className="py-4 px-5 text-left font-medium">Due Date</th>
                    <th className="py-4 px-5 text-right font-medium">Amount</th>
                    <th className="py-4 px-5 text-center font-medium">Status</th>
                    <th className="py-4 px-5 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="py-4 px-5 font-medium">{invoice.invoice_number}</td>
                      <td className="py-4 px-5">
                        {invoice.client ? (
                          <div>
                            <span>{invoice.client.name}</span>
                            {invoice.client.company && (
                              <span className="text-sm text-muted-foreground block">{invoice.client.company}</span>
                            )}
                          </div>
                        ) : (
                          "Unknown Client"
                        )}
                      </td>
                      <td className="py-4 px-5">{formatDate(invoice.issue_date)}</td>
                      <td className="py-4 px-5">{formatDate(invoice.due_date)}</td>
                      <td className="py-4 px-5 text-right font-medium">{formatAmount(invoice.total_amount)}</td>
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
                          {invoice.status === 'draft' && (
                            <button 
                              className="p-2 rounded-full hover:bg-secondary transition-colors" 
                              title="Edit"
                              onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
                            >
                              <Edit size={18} />
                            </button>
                          )}
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
          )}
        </CustomCard>
      </div>
    </MainLayout>
  );
};

export default Invoices;
