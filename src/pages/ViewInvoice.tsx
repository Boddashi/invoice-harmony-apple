
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import CustomCard from '../components/ui/CustomCard';
import { ArrowLeft, Download } from 'lucide-react';
import InvoiceBasicInfo from '@/components/invoices/InvoiceBasicInfo';
import InvoiceFrom from '@/components/invoices/InvoiceFrom';
import InvoiceNotes from '@/components/invoices/InvoiceNotes';
import InvoiceSummary from '@/components/invoices/InvoiceSummary';
import InvoiceItemsReadOnly from '@/components/invoices/InvoiceItemsReadOnly';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  street?: string;
  number?: string;
  city?: string;
  country?: string;
  vat_number?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  vat_rate: string;
}

interface Item {
  id: string;
  title: string;
  price: number;
  vat: string;
}

interface VatGroup {
  rate: string;
  subtotal: number;
  vat: number;
}

const ViewInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  
  const [isLoading, setIsLoading] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!id || !user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch invoice data
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select(`
            *,
            client:clients(*)
          `)
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (invoiceError) throw invoiceError;
        
        // Fetch invoice items
        const { data: invoiceItems, error: itemsError } = await supabase
          .from('invoice_items')
          .select(`
            *,
            items:item_id(id, title, price, vat)
          `)
          .eq('invoice_id', id);
          
        if (itemsError) throw itemsError;
        
        // Fetch all available items
        const { data: allItems, error: allItemsError } = await supabase
          .from('items')
          .select('*');
          
        if (allItemsError) throw allItemsError;
        
        setInvoiceNumber(invoiceData.invoice_number);
        setIssueDate(invoiceData.issue_date);
        setDueDate(invoiceData.due_date);
        setStatus(invoiceData.status);
        setNotes(invoiceData.notes || '');
        setClient(invoiceData.client as Client);
        setTotal(invoiceData.total_amount);
        setAvailableItems(allItems || []);
        
        if (invoiceItems && invoiceItems.length > 0) {
          const formattedItems = invoiceItems.map(item => {
            const itemData = item.items as unknown as Item;
            return {
              id: item.id || crypto.randomUUID(),
              description: itemData.id,
              quantity: item.quantity,
              unit_price: item.total_amount / item.quantity,
              amount: item.total_amount,
              vat_rate: itemData.vat
            };
          });
          setItems(formattedItems);
        }
      } catch (error: any) {
        console.error('Error fetching invoice data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch invoice data."
        });
        navigate('/invoices');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoiceData();
  }, [id, user, navigate, toast]);
  
  const getVatGroups = (): VatGroup[] => {
    const vatGroups: Record<string, {
      subtotal: number;
      vat: number;
    }> = {};
    
    items.forEach(item => {
      const vatRate = item.vat_rate || '0%';
      const vatPercentage = parseFloat(vatRate) || 0;
      if (!vatGroups[vatRate]) {
        vatGroups[vatRate] = {
          subtotal: 0,
          vat: 0
        };
      }
      vatGroups[vatRate].subtotal += item.amount;
      vatGroups[vatRate].vat += item.amount * vatPercentage / 100;
    });
    
    return Object.entries(vatGroups).map(([rate, values]) => ({
      rate,
      subtotal: values.subtotal,
      vat: values.vat
    }));
  };
  
  const handleDownloadPDF = async () => {
    try {
      // Only pending/paid invoices should have PDFs
      if (status === 'draft') {
        toast({
          title: "Info",
          description: "Draft invoices don't have PDF versions. Send the invoice first to generate a PDF."
        });
        return;
      }
      
      // Get the public URL for the PDF
      const { data } = supabase.storage
        .from('invoices')
        .getPublicUrl(`${id}/invoice.pdf`);
      
      if (data && data.publicUrl) {
        // Create a link and trigger download
        const link = document.createElement('a');
        link.href = data.publicUrl;
        link.download = `invoice-${invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "PDF not found. Please try regenerating the invoice."
        });
      }
    } catch (error: any) {
      console.error('Error downloading invoice PDF:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to download PDF."
      });
    }
  };
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'pending':
        return 'bg-apple-orange/10 text-apple-orange border-apple-orange/20';
      case 'paid':
        return 'bg-apple-green/10 text-apple-green border-apple-green/20';
      case 'overdue':
        return 'bg-apple-red/10 text-apple-red border-apple-red/20';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/invoices')}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold">View Invoice</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-sm font-medium border rounded-full ${getStatusBadgeColor(status)}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            
            {(status === 'pending' || status === 'paid') && (
              <button 
                className="flex items-center gap-2 border border-border rounded-full px-4 py-2 hover:bg-secondary transition-colors"
                onClick={handleDownloadPDF}
              >
                <Download size={16} />
                <span>Download PDF</span>
              </button>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading invoice...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InvoiceBasicInfo 
                invoiceNumber={invoiceNumber}
                issueDate={issueDate}
                dueDate={dueDate}
                readOnly={true}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CustomCard>
                <h3 className="text-lg font-medium mb-4">Client</h3>
                
                {client && (
                  <div className="space-y-1">
                    <p className="font-medium">{client.name}</p>
                    {client.email && <p>{client.email}</p>}
                    {client.phone && <p>{client.phone}</p>}
                    {client.street && (
                      <p>
                        {client.street} {client.number && `${client.number}`}
                      </p>
                    )}
                    {(client.city || client.country) && (
                      <p>
                        {client.city} {client.country && `, ${client.country}`}
                      </p>
                    )}
                    {client.vat_number && <p>VAT: {client.vat_number}</p>}
                  </div>
                )}
              </CustomCard>
              
              <InvoiceFrom userEmail={user?.email} readOnly={true} />
            </div>
            
            <InvoiceItemsReadOnly 
              items={items}
              availableItems={availableItems}
              currencySymbol={currencySymbol}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InvoiceNotes notes={notes} readOnly={true} />
              <InvoiceSummary 
                vatGroups={getVatGroups()}
                total={total}
                currencySymbol={currencySymbol}
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ViewInvoice;
