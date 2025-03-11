import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import CustomCard from '../ui/CustomCard';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import InvoiceActions from '../invoices/InvoiceActions';

type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'draft';

interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  total_amount: number;
  client?: {
    name: string;
  };
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
    case 'draft':
      return {
        label: 'Draft',
        color: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: FileText
      };
  }
};

const InvoiceList = () => {
  
  const { currencySymbol } = useCurrency();
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) {
          throw error;
        }
        
        const typedData = data?.map(invoice => ({
          ...invoice,
          status: invoice.status as InvoiceStatus
        })) || [];
        
        setRecentInvoices(typedData);
      } catch (error: any) {
        console.error('Error fetching recent invoices:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch recent invoices."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoices();
  }, [user, toast]);

  return (
    <CustomCard className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recent Invoices</h2>
        <Link to="/invoices" className="text-apple-blue flex items-center text-sm hover:underline">
          View all <ArrowRight size={16} className="ml-1" />
        </Link>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">Loading invoices...</p>
        </div>
      ) : recentInvoices.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">No invoices found. Create your first invoice to get started.</p>
        </div>
      ) : (
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
                    <h3 className="font-medium">{invoice.client?.name || "Unknown Client"}</h3>
                    <p className="text-sm text-muted-foreground">{invoice.invoice_number} • {formatDate(invoice.issue_date)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">{formatAmount(invoice.total_amount)}</p>
                    <p className="text-sm text-muted-foreground">Due {formatDate(invoice.due_date)}</p>
                  </div>
                  
                  <div className={cn(
                    "px-3 py-1 text-xs font-medium border rounded-full",
                    status.color
                  )}>
                    {status.label}
                  </div>
                  
                  <div onClick={(e) => e.preventDefault()}>
                    <InvoiceActions invoiceId={invoice.id} status={invoice.status} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </CustomCard>
  );
};

export default InvoiceList;
