import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash, FileDown } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import CustomCard from '../components/ui/CustomCard';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AddClientModal from '@/components/clients/AddClientModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const NewInvoice = () => {
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

  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const {
          data,
          error
        } = await supabase.from('clients').select('id, name').eq('user_id', user.id);
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

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const {
          data,
          error
        } = await supabase.from('items').select('*');
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

  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!isEditMode || !id || !user) return;
      try {
        setIsLoading(true);
        const {
          data: invoiceData,
          error: invoiceError
        } = await supabase.from('invoices').select('*').eq('id', id).eq('user_id', user.id).single();
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
        const {
          data: invoiceItems,
          error: itemsError
        } = await supabase.from('invoice_items').select(`
            *,
            items:item_id(id, title, price, vat)
          `).eq('invoice_id', id);
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

  useEffect(() => {
    const fetchVats = async () => {
      try {
        const {
          data,
          error
        } = await supabase.from('vats').select('*');
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
          setInvoiceNumber(`${prefix}-${dateStr}`);
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

  useEffect(() => {
    const fetchVats = async () => {
      try {
        const {
          data,
          error
        } = await supabase.from('vats').select('*');
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

  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      setSelectedClient(client || null);
    } else {
      setSelectedClient(null);
    }
  }, [selectedClientId, clients]);

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
      const {
        data,
        error
      } = await supabase.from('clients').insert({
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
        const {
          error: invoiceError
        } = await supabase.from('invoices').update({
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
        
        const {
          error: deleteError
        } = await supabase.from('invoice_items').delete().eq('invoice_id', id);
        if (deleteError) {
          throw deleteError;
        }
        const invoiceItems = items.map(item => ({
          invoice_id: id,
          item_id: item.description,
          quantity: item.quantity,
          total_amount: item.amount
        }));
        const {
          error: invoiceItemsError
        } = await supabase.from('invoice_items').insert(invoiceItems);
        if (invoiceItemsError) {
          throw invoiceItemsError;
        }
        toast({
          title: "Success",
          description: `Invoice ${status === 'draft' ? 'saved as draft' : 'updated'} successfully.`
        });
      } else {
        const {
          data: invoice,
          error: invoiceError
        } = await supabase.from('invoices').insert({
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
        const {
          error: invoiceItemsError
        } = await supabase.from('invoice_items').insert(invoiceItems);
        if (invoiceItemsError) {
          throw invoiceItemsError;
        }
        toast({
          title: "Success",
          description: `Invoice ${status === 'draft' ? 'saved as draft' : 'created'} successfully.`
        });
      }

      // Only generate PDF if status is 'pending'
      if (invoiceId && status === 'pending') {
        const pdfBase64 = await generatePDF(invoiceId);
        if (pdfBase64) {
          setPdfUrl(pdfBase64);
          setTimeout(() => {
            const shouldDownload = window.confirm('Invoice saved successfully. Do you want to download the PDF?');
            if (shouldDownload) {
              handleDownloadPDF();
            }
            navigate('/invoices');
          }, 100);
          return; // Don't navigate yet, wait for user confirmation
        }
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

  const getVatGroups = () => {
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

  if (isLoading && isEditMode) {
    return <MainLayout>
        <div className="max-w-5xl mx-auto p-8 text-center">
          <p className="text-muted-foreground">Loading invoice data...</p>
        </div>
      </MainLayout>;
  }

  return <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/invoices')} className="p-2 rounded-full hover:bg-secondary transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold">
              {isEditMode ? 'Edit Invoice' : 'Create New Invoice'}
            </h1>
          </div>
          
          <div className="flex gap-3">
            {pdfUrl && (
              <button 
                type="button" 
                onClick={handleDownloadPDF} 
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <FileDown size={18} />
                <span>Download PDF</span>
              </button>
            )}
            
            <button 
              type="button" 
              onClick={handleSaveAsDraft} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${status === 'draft' ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-50'}`} 
              disabled={isSubmitting || isGeneratingPDF}
            >
              {isSubmitting && status === 'draft' ? 'Saving...' : 'Save as Draft'}
            </button>
            
            <button 
              type="button" 
              onClick={handleCreateAndSend} 
              className="apple-button flex items-center gap-2" 
              disabled={isSubmitting || isGeneratingPDF}
            >
              {isSubmitting && status === 'pending' ? 'Saving...' : isEditMode ? 'Update & Send' : 'Create & Send'}
            </button>
          </div>
        </div>
        
        <form id="invoice-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomCard className="col-span-1 md:col-span-2">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-muted-foreground">Invoice Number</label>
                  <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="input-field w-full" required />
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-muted-foreground">Issue Date</label>
                    <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="input-field w-full" required />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-muted-foreground">Due Date</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input-field w-full" required />
                  </div>
                </div>
              </div>
            </CustomCard>
            
            <CustomCard>
              <h3 className="text-lg font-medium mb-4">Client</h3>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-muted-foreground">Select Client</label>
                <div className="relative">
                  <select value={selectedClientId} onChange={e => {
                  if (e.target.value === "add-new") {
                    setIsAddClientModalOpen(true);
                  } else {
                    setSelectedClientId(e.target.value);
                  }
                }} className="client-select-dropdown w-full" required>
                    <option value="">Select a client</option>
                    {clients.map(client => <option key={client.id} value={client.id}>
                        {client.name}
                      </option>)}
                    <option value="add-new" className="font-medium text-apple-blue">
                      + Add New Client
                    </option>
                  </select>
                </div>
              </div>
            </CustomCard>
            
            <CustomCard>
              <h3 className="text-lg font-medium mb-4">From</h3>
              
              <div className="space-y-1">
                <p className="font-medium">{user?.email}</p>
                <p className="text-muted-foreground text-sm">Your business details will appear here</p>
              </div>
            </CustomCard>
          </div>
          
          <CustomCard>
            <h3 className="text-lg font-medium mb-4">Items</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 font-medium text-muted-foreground text-sm">
                <div className="col-span-4">Item</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-2">VAT</div>
                <div className="col-span-1">Amount</div>
                <div className="col-span-1"></div>
              </div>
              
              {items.map((item, index) => <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                    <select className="input-field w-full" value={item.description} onChange={e => {
                  handleItemDescriptionChange(item.id, e.target.value);
                }} required>
                      <option value="">Select an item</option>
                      {availableItems.map(availableItem => <option key={availableItem.id} value={availableItem.id}>
                          {availableItem.title} - {currencySymbol}{availableItem.price}
                        </option>)}
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <input type="number" min="1" step="1" value={item.quantity} onChange={e => handleItemQuantityChange(item.id, Number(e.target.value))} className="input-field w-full" required />
                  </div>
                  
                  <div className="col-span-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        {currencySymbol}
                      </span>
                      <input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => handleItemUnitPriceChange(item.id, Number(e.target.value))} className="input-field w-full pl-8" required />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <Select value={item.vat_rate} onValueChange={value => handleItemVatChange(item.id, value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="VAT" />
                      </SelectTrigger>
                      <SelectContent>
                        {vats.map(vat => <SelectItem key={vat.title} value={vat.title}>
                            {vat.title}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-1 font-medium">
                    {currencySymbol}{item.amount.toFixed(2)}
                  </div>
                  
                  <div className="col-span-1 text-right">
                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors" disabled={items.length === 1}>
                      <Trash size={18} />
                    </button>
                  </div>
                </div>)}
              
              <button type="button" onClick={handleAddItem} className="flex items-center gap-2 text-apple-blue hover:text-apple-blue/80 font-medium transition-colors">
                <Plus size={18} />
                <span>Add Item</span>
              </button>
            </div>
          </CustomCard>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomCard>
              <h3 className="text-lg font-medium mb-4">Notes</h3>
              
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment terms, delivery notes, or any other relevant information" className="input-field w-full min-h-[120px]" />
            </CustomCard>
            
            <CustomCard>
              <h3 className="text-lg font-medium mb-4">Summary</h3>
              
              <div className="space-y-4">
                {getVatGroups().map((group, index) => <div key={index} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({group.rate})</span>
                      <span className="font-medium">{currencySymbol}{group.subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground pl-0">VAT {group.rate}</span>
                      <span className="font-medium">{currencySymbol}{group.vat.toFixed(2)}</span>
                    </div>
                  </div>)}
                
                <div className="border-t border-border pt-4 flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-lg">{currencySymbol}{total.toFixed(2)}</span>
                </div>
              </div>
            </CustomCard>
          </div>
        </form>
        
        <AddClientModal isOpen={isAddClientModalOpen} onClose={() => setIsAddClientModalOpen(false)} onAddClient={handleAddClient} />
      </div>
    </MainLayout>;
};

export default NewInvoice;
