
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import InvoiceList from '@/components/dashboard/InvoiceList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  amount: number;
  total_amount: number;
  client: {
    id: string;
    name: string;
  };
}

const Invoices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            client: client_id(id, name)
          `)
          .eq('user_id', user.id);
        
        if (error) {
          throw error;
        }
        
        const transformedData = data.map((invoice: any) => ({
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          status: invoice.status,
          amount: invoice.amount,
          total_amount: invoice.total_amount,
          client: {
            id: invoice.client.id,
            name: invoice.client.name
          }
        }));
        
        setInvoices(transformedData);
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

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Invoices</h1>
          
          <button 
            onClick={() => navigate('/invoices/new')}
            className="apple-button flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Create Invoice</span>
          </button>
        </div>
        
        <InvoiceList 
          invoices={invoices} 
          isLoading={isLoading} 
        />
      </div>
    </MainLayout>
  );
};

export default Invoices;
