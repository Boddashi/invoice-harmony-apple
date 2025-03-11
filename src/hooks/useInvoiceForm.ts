
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateInvoicePDF, InvoiceData } from '@/utils/pdfGenerator';

interface Client {
  id: string;
  name: string;
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

interface Vat {
  title: string;
  amount: number | null;
}

interface VatGroup {
  rate: string;
  subtotal: number;
  vat: number;
}

export const useInvoiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { currencySymbol } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClient, setSelectedClient] = useState<{ name: string } | null>(null);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'draft' | 'pending'>('draft');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{
    id: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unit_price: 0,
    amount: 0,
    vat_rate: ''
  }]);
  const [subTotal, setSubTotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [vats, setVats] = useState<Vat[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('clients')
          .select('id, name')
          .eq('user_id', user.id);
          
        if (error) {
          throw error;
        }
        setClients(data || []);
      } catch (error: any) {
        console.error('Error fetching clients:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch clients."
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, [user, toast]);

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data, error } = await supabase.from('items').select('*');
        if (error) throw error;
        setAvailableItems(data || []);
      } catch (error: any) {
        console.error('Error fetching items:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch items."
        });
      }
    };
    fetchItems();
  }, [toast]);

  // Fetch invoice data if in edit mode
  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!isEditMode || !id || !user) return;
      try {
        setIsLoading(true);
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (invoiceError) throw invoiceError;
        if (!invoiceData) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Invoice not found"
          });
          navigate('/invoices');
          return;
        }
        
        const { data: invoiceItems, error: itemsError } = await supabase
          .from('invoice_items')
          .select(`
            *,
            items:item_id(id, title, price, vat)
          `)
          .eq('invoice_id', id);
          
        if (itemsError) throw itemsError;
        
        setInvoiceNumber(invoiceData.invoice_number);
        setSelectedClientId(invoiceData.client_id);
        setIssueDate(invoiceData.issue_date);
        setDueDate(invoiceData.due_date);
        setStatus(invoiceData.status as 'draft' | 'pending');
        setNotes(invoiceData.notes || '');
        setSubTotal(invoiceData.amount);
        setTaxRate(invoiceData.tax_rate || 0);
        setTaxAmount(invoiceData.tax_amount || 0);
        setTotal(invoiceData.total_amount);
        
        if (invoiceItems && invoiceItems.length > 0) {
          const formattedItems = invoiceItems.map(item => {
            const itemData = item.items as unknown as Item;
            return {
              id: crypto.randomUUID(),
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
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoiceData();
  }, [id, isEditMode, user, navigate, toast]);

  // Fetch VAT rates
  useEffect(() => {
    const fetchVats = async () => {
      try {
        const { data, error } = await supabase.from('vats').select('*');
        if (error) throw error;
        setVats(data || []);
      } catch (error: any) {
        console.error('Error fetching VAT rates:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch VAT rates."
        });
      }
    };
    fetchVats();
  }, [toast]);

  // Generate invoice number
  useEffect(() => {
    const generateInvoiceNumber = async () => {
      if (isEditMode || invoiceNumber) return;
      
      try {
        if (!user) return;
        
        const { data: settingsData, error: settingsError } = await supabase
          .from('company_settings')
          .select('invoice_prefix, invoice_number_type')
          .eq('user_id', user.id)
          .single();
          
        if (settingsError) {
          console.error('Error fetching company settings:', settingsError);
          // Use a default prefix and incremental number instead of timestamp
          const { data: latestInvoice } = await supabase
            .from('invoices')
            .select('invoice_number')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          const defaultPrefix = 'INV';
          let nextNumber = 1; // Start with 1 for the first invoice
          
          if (latestInvoice && latestInvoice.invoice_number) {
            const latestNumberStr = latestInvoice.invoice_number.split('-').pop();
            if (latestNumberStr && !isNaN(Number(latestNumberStr))) {
              nextNumber = Number(latestNumberStr) + 1;
            }
          }
          
          setInvoiceNumber(`${defaultPrefix}-${String(nextNumber).padStart(6, '0')}`);
          return;
        }
        
        const prefix = settingsData?.invoice_prefix || 'INV';
        const numberType = settingsData?.invoice_number_type as 'date' | 'incremental' || 'incremental'; // Default to incremental
        
        if (numberType === 'date') {
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');
          const dateStr = `${year}${month}${day}`;
          
          // Check for invoices with the same date-based number to add increment
          const { data: existingInvoices, error: existingInvoicesError } = await supabase
            .from('invoices')
            .select('invoice_number')
            .eq('user_id', user.id)
            .like('invoice_number', `${prefix}-${dateStr}%`)
            .order('invoice_number', { ascending: false });
            
          if (existingInvoicesError) {
            console.error('Error checking existing invoices:', existingInvoicesError);
            setInvoiceNumber(`${prefix}-${dateStr}/1`);
            return;
          }
          
          let increment = 1;
          if (existingInvoices && existingInvoices.length > 0) {
            // Extract the highest increment from existing invoices
            for (const invoice of existingInvoices) {
              const parts = invoice.invoice_number.split('/');
              if (parts.length > 1) {
                const existingIncrement = parseInt(parts[1], 10);
                if (!isNaN(existingIncrement) && existingIncrement >= increment) {
                  increment = existingIncrement + 1;
                }
              }
            }
          }
          
          setInvoiceNumber(`${prefix}-${dateStr}/${increment}`);
        } else {
          // For incremental type
          const { data: latestInvoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('invoice_number')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          // For the first invoice or if there's an error fetching the latest invoice
          // (except for the "no rows returned" error which is expected for the first invoice)
          let nextNumber = 1; // Start with 1 for the first invoice
          
          if (latestInvoice) {
            const latestNumberStr = latestInvoice.invoice_number.split('-').pop();
            if (latestNumberStr && !isNaN(Number(latestNumberStr))) {
              nextNumber = Number(latestNumberStr) + 1;
            }
          }
          
          setInvoiceNumber(`${prefix}-${String(nextNumber).padStart(6, '0')}`);
        }
      } catch (error) {
        console.error('Error generating invoice number:', error);
        // Fallback to incremental numbering instead of timestamp
        const defaultPrefix = 'INV';
        setInvoiceNumber(`${defaultPrefix}-000001`); // Start with 1 for the first invoice
      }
    };
    
    generateInvoiceNumber();
  }, [isEditMode, invoiceNumber, user]);

  // Update selected client when client ID changes
  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      setSelectedClient(client || null);
    } else {
      setSelectedClient(null);
    }
  }, [selectedClientId, clients]);

  // Calculate subtotal, tax, and total when items change
  useEffect(() => {
    const calculatedSubTotal = items.reduce((sum, item) => sum + item.amount, 0);
    setSubTotal(calculatedSubTotal);
    
    const calculatedTaxAmount = items.reduce((sum, item) => {
      const vatRate = availableItems.find(i => i.id === item.description)?.vat || '0%';
      const rate = parseFloat(vatRate) / 100;
      return sum + item.amount * rate;
    }, 0);
    
    setTaxAmount(calculatedTaxAmount);
    setTotal(calculatedSubTotal + calculatedTaxAmount);
  }, [items, availableItems]);

  // Set due date based on issue date
  useEffect(() => {
    if (issueDate && !dueDate) {
      const issueDateTime = new Date(issueDate);
      const nextMonth = new Date(issueDateTime);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setDueDate(nextMonth.toISOString().split('T')[0]);
    }
  }, [issueDate, dueDate]);

  const handleAddClient = async (newClient: any) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('clients').insert({
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        street: newClient.street,
        number: newClient.number,
        bus: newClient.bus,
        postcode: newClient.postcode,
        city: newClient.city,
        country: newClient.country,
        vat_number: newClient.vatNumber,
        type: newClient.type,
        user_id: user.id
      }).select().single();
      
      if (error) {
        throw error;
      }
      
      setClients([...clients, {
        id: data.id,
        name: data.name
      }]);
      setSelectedClientId(data.id);
    } catch (error: any) {
      console.error('Error saving client:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save client."
      });
    }
  };

  const handleItemDescriptionChange = (id: string, value: string) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const selectedItem = availableItems.find(i => i.id === value);
        return {
          ...item,
          description: value,
          unit_price: selectedItem?.price || 0,
          amount: (selectedItem?.price || 0) * item.quantity,
          vat_rate: selectedItem?.vat || '0%'
        };
      }
      return item;
    }));
  };

  const handleItemQuantityChange = (id: string, value: number) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const quantity = value;
        const amount = quantity * item.unit_price;
        return {
          ...item,
          quantity,
          amount
        };
      }
      return item;
    }));
  };

  const handleItemUnitPriceChange = (id: string, value: number) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const unit_price = value;
        const amount = item.quantity * unit_price;
        return {
          ...item,
          unit_price,
          amount
        };
      }
      return item;
    }));
  };

  const handleItemVatChange = (id: string, value: string) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          vat_rate: value
        };
      }
      return item;
    }));
  };

  const handleAddItem = () => {
    setItems([...items, {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unit_price: 0,
      amount: 0,
      vat_rate: ''
    }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const generatePDF = async (invoiceId: string) => {
    if (!selectedClient || !user) return null;
    
    setIsGeneratingPDF(true);
    try {
      const itemsWithTitles = items.map(item => {
        const foundItem = availableItems.find(i => i.id === item.description);
        return {
          ...item,
          description: foundItem?.title || item.description
        };
      });

      const invoiceData: InvoiceData = {
        id: invoiceId,
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        due_date: dueDate,
        client_name: selectedClient.name,
        user_email: user.email || '',
        items: itemsWithTitles,
        subTotal,
        taxAmount,
        total,
        notes,
        currencySymbol
      };

      const pdfBase64 = await generateInvoicePDF(invoiceData);
      return pdfBase64;
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF."
      });
      return null;
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!pdfUrl) return;
    
    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `invoice-${invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveAsDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    setStatus('draft');
    setTimeout(() => {
      const form = document.getElementById('invoice-form') as HTMLFormElement;
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 0);
  };

  const handleCreateAndSend = (e: React.MouseEvent) => {
    e.preventDefault();
    setStatus('pending');
    setTimeout(() => {
      const form = document.getElementById('invoice-form') as HTMLFormElement;
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with status:", status);
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create an invoice."
      });
      return;
    }
    
    if (!selectedClientId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a client for this invoice."
      });
      return;
    }
    
    if (items.some(item => !item.description || item.amount === 0)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "All items must have a description and amount."
      });
      return;
    }
    
    if (!dueDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a due date for this invoice."
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      let invoiceId = id;

      if (isEditMode) {
        const { error: invoiceError } = await supabase.from('invoices').update({
          client_id: selectedClientId,
          invoice_number: invoiceNumber,
          issue_date: issueDate || new Date().toISOString().split('T')[0],
          due_date: dueDate,
          status: status,
          amount: subTotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: total,
          notes: notes
        }).eq('id', id);
        
        if (invoiceError) {
          throw invoiceError;
        }
        
        const { error: deleteError } = await supabase.from('invoice_items').delete().eq('invoice_id', id);
        if (deleteError) {
          throw deleteError;
        }
        
        const invoiceItems = items.map(item => ({
          invoice_id: id,
          item_id: item.description,
          quantity: item.quantity,
          total_amount: item.amount
        }));
        
        const { error: invoiceItemsError } = await supabase.from('invoice_items').insert(invoiceItems);
        if (invoiceItemsError) {
          throw invoiceItemsError;
        }

        // Generate PDF for edited invoice when status is changed to pending
        if (status === 'pending') {
          const pdfBase64 = await generatePDF(id);
          if (pdfBase64) {
            setPdfUrl(pdfBase64);
            setTimeout(() => {
              const shouldDownload = window.confirm('Invoice updated and PDF generated. Do you want to download the PDF?');
              if (shouldDownload) {
                handleDownloadPDF();
              }
              navigate('/invoices');
            }, 100);
            return;
          }
        }

        toast({
          title: "Success",
          description: `Invoice ${status === 'draft' ? 'saved as draft' : 'updated'} successfully.`
        });
      } else {
        const { data: invoice, error: invoiceError } = await supabase.from('invoices').insert({
          user_id: user.id,
          client_id: selectedClientId,
          invoice_number: invoiceNumber,
          issue_date: issueDate || new Date().toISOString().split('T')[0],
          due_date: dueDate,
          status: status,
          amount: subTotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: total,
          notes: notes
        }).select().single();
        
        if (invoiceError) {
          throw invoiceError;
        }
        
        invoiceId = invoice.id;
        const invoiceItems = items.map(item => ({
          invoice_id: invoice.id,
          item_id: item.description,
          quantity: item.quantity,
          total_amount: item.amount
        }));
        
        const { error: invoiceItemsError } = await supabase.from('invoice_items').insert(invoiceItems);
        if (invoiceItemsError) {
          throw invoiceItemsError;
        }

        // Generate PDF for new invoice with pending status
        if (status === 'pending') {
          const pdfBase64 = await generatePDF(invoiceId);
          if (pdfBase64) {
            setPdfUrl(pdfBase64);
            setTimeout(() => {
              const shouldDownload = window.confirm('Invoice created and PDF generated. Do you want to download the PDF?');
              if (shouldDownload) {
                handleDownloadPDF();
              }
              navigate('/invoices');
            }, 100);
            return;
          }
        }
        
        toast({
          title: "Success",
          description: `Invoice ${status === 'draft' ? 'saved as draft' : 'created'} successfully.`
        });
      }
      
      navigate('/invoices');
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save invoice."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return {
    // State
    isEditMode,
    isLoading,
    isSubmitting,
    isGeneratingPDF,
    isAddClientModalOpen,
    invoiceNumber,
    selectedClientId,
    selectedClient,
    issueDate,
    dueDate,
    status,
    notes,
    items,
    subTotal,
    taxRate,
    taxAmount,
    total,
    clients,
    availableItems,
    vats,
    pdfUrl,
    currencySymbol,
    user,
    
    // Methods
    setIsAddClientModalOpen,
    setInvoiceNumber,
    setSelectedClientId,
    setIssueDate,
    setDueDate,
    setNotes,
    handleAddClient,
    handleItemDescriptionChange,
    handleItemQuantityChange,
    handleItemUnitPriceChange,
    handleItemVatChange,
    handleAddItem,
    handleRemoveItem,
    handleDownloadPDF,
    handleSaveAsDraft,
    handleCreateAndSend,
    handleSubmit,
    getVatGroups
  };
};
