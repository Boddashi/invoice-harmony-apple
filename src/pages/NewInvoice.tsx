
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import CustomCard from '../components/ui/CustomCard';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AddClientModal from '@/components/clients/AddClientModal';

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
  
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'draft' | 'pending'>('draft');
  const [notes, setNotes] = useState('');
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0, amount: 0, vat_rate: '' }
  ]);
  
  const [subTotal, setSubTotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);
  
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  
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
  
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*');
          
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

  // Fetch invoice data when in edit mode
  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!isEditMode || !id || !user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch the invoice data
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
        
        // Fetch invoice items
        const { data: invoiceItems, error: itemsError } = await supabase
          .from('invoice_items')
          .select(`
            *,
            items:item_id(id, title, price, vat)
          `)
          .eq('invoice_id', id);
        
        if (itemsError) throw itemsError;
        
        // Set invoice data
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
        
        // Set invoice items
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
      
      setClients([...clients, { id: data.id, name: data.name }]);
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
  
  useEffect(() => {
    const generateInvoiceNumber = () => {
      const prefix = 'INV';
      const timestamp = Date.now().toString().slice(-6);
      return `${prefix}-${timestamp}`;
    };
    
    // Only generate a new invoice number if not in edit mode
    if (!isEditMode && !invoiceNumber) {
      setInvoiceNumber(generateInvoiceNumber());
    }
  }, [isEditMode, invoiceNumber]);
  
  useEffect(() => {
    if (issueDate && !dueDate) {
      const date = new Date(issueDate);
      date.setDate(date.getDate() + 30);
      setDueDate(date.toISOString().split('T')[0]);
    }
  }, [issueDate, dueDate]);
  
  useEffect(() => {
    const calculatedSubTotal = items.reduce((sum, item) => sum + item.amount, 0);
    setSubTotal(calculatedSubTotal);
    
    const calculatedTaxAmount = items.reduce((sum, item) => {
      const vatRate = availableItems.find(i => i.id === item.description)?.vat || '0%';
      const rate = parseFloat(vatRate) / 100;
      return sum + (item.amount * rate);
    }, 0);
    
    setTaxAmount(calculatedTaxAmount);
    setTotal(calculatedSubTotal + calculatedTaxAmount);
  }, [items, availableItems]);
  
  const handleItemDescriptionChange = (id: string, value: string) => {
    setItems(prevItems =>
      prevItems.map(item => {
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
      })
    );
  };
  
  const handleItemQuantityChange = (id: string, value: number) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const quantity = value;
          const amount = quantity * item.unit_price;
          return { ...item, quantity, amount };
        }
        return item;
      })
    );
  };
  
  const handleItemUnitPriceChange = (id: string, value: number) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const unit_price = value;
          const amount = item.quantity * unit_price;
          return { ...item, unit_price, amount };
        }
        return item;
      })
    );
  };
  
  const handleAddItem = () => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0, amount: 0, vat_rate: '' }
    ]);
  };
  
  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    try {
      setIsSubmitting(true);
      
      if (isEditMode) {
        // Update existing invoice
        const { error: invoiceError } = await supabase
          .from('invoices')
          .update({
            client_id: selectedClientId,
            invoice_number: invoiceNumber,
            issue_date: issueDate,
            due_date: dueDate,
            status: status,
            amount: subTotal,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            total_amount: total,
            notes: notes
          })
          .eq('id', id);
        
        if (invoiceError) {
          throw invoiceError;
        }
        
        // Delete existing invoice items
        const { error: deleteError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', id);
        
        if (deleteError) {
          throw deleteError;
        }
        
        // Add new invoice items
        const invoiceItems = items.map(item => ({
          invoice_id: id,
          item_id: item.description,
          quantity: item.quantity,
          total_amount: item.amount
        }));
        
        const { error: invoiceItemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems);
        
        if (invoiceItemsError) {
          throw invoiceItemsError;
        }
        
        toast({
          title: "Success",
          description: `Invoice ${status === 'draft' ? 'saved as draft' : 'updated'} successfully.`
        });
      } else {
        // Create new invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            user_id: user.id,
            client_id: selectedClientId,
            invoice_number: invoiceNumber,
            issue_date: issueDate,
            due_date: dueDate,
            status: status,
            amount: subTotal,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            total_amount: total,
            notes: notes
          })
          .select()
          .single();
        
        if (invoiceError) {
          throw invoiceError;
        }
        
        const invoiceItems = items.map(item => ({
          invoice_id: invoice.id,
          item_id: item.description,
          quantity: item.quantity,
          total_amount: item.amount
        }));
        
        const { error: invoiceItemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems);
        
        if (invoiceItemsError) {
          throw invoiceItemsError;
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
  
  const handleSaveAsDraft = async (e: React.MouseEvent) => {
    e.preventDefault();
    setStatus('draft');
    handleSubmit(e as unknown as React.FormEvent);
  };

  const handleCreateAndSend = async (e: React.MouseEvent) => {
    e.preventDefault();
    setStatus('pending');
    handleSubmit(e as unknown as React.FormEvent);
  };

  // Show loading state while fetching invoice data
  if (isLoading && isEditMode) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto p-8 text-center">
          <p className="text-muted-foreground">Loading invoice data...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/invoices')}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold">
              {isEditMode ? 'Edit Invoice' : 'Create New Invoice'}
            </h1>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSaveAsDraft}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                status === 'draft' 
                  ? 'bg-gray-100 text-gray-700' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting && status === 'draft' ? 'Saving...' : 'Save as Draft'}
            </button>
            
            <button
              type="button"
              onClick={handleCreateAndSend}
              className="apple-button flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && status === 'pending' 
                ? 'Saving...' 
                : isEditMode ? 'Update & Send' : 'Create & Send'}
            </button>
          </div>
        </div>
        
        <form id="invoice-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomCard className="col-span-1 md:col-span-2">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-muted-foreground">Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="input-field w-full"
                    required
                  />
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-muted-foreground">Issue Date</label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="input-field w-full"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-muted-foreground">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="input-field w-full"
                      required
                    />
                  </div>
                </div>
              </div>
            </CustomCard>
            
            <CustomCard>
              <h3 className="text-lg font-medium mb-4">Client</h3>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-muted-foreground">Select Client</label>
                <div className="relative">
                  <select
                    value={selectedClientId}
                    onChange={(e) => {
                      if (e.target.value === "add-new") {
                        setIsAddClientModalOpen(true);
                      } else {
                        setSelectedClientId(e.target.value);
                      }
                    }}
                    className="client-select-dropdown w-full"
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
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
                <div className="col-span-1">VAT</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-1"></div>
              </div>
              
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                    <select
                      className="input-field w-full"
                      value={item.description}
                      onChange={(e) => {
                        handleItemDescriptionChange(item.id, e.target.value);
                      }}
                      required
                    >
                      <option value="">Select an item</option>
                      {availableItems.map(availableItem => (
                        <option key={availableItem.id} value={availableItem.id}>
                          {availableItem.title} - {currencySymbol}{availableItem.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => handleItemQuantityChange(item.id, Number(e.target.value))}
                      className="input-field w-full"
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        {currencySymbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemUnitPriceChange(item.id, Number(e.target.value))}
                        className="input-field w-full pl-8"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-span-1 text-muted-foreground text-sm">
                    {item.vat_rate || '0%'}
                  </div>
                  
                  <div className="col-span-2 font-medium">
                    {currencySymbol}{item.amount.toFixed(2)}
                  </div>
                  
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      disabled={items.length === 1}
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-2 text-apple-blue hover:text-apple-blue/80 font-medium transition-colors"
              >
                <Plus size={18} />
                <span>Add Item</span>
              </button>
            </div>
          </CustomCard>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomCard>
              <h3 className="text-lg font-medium mb-4">Notes</h3>
              
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, delivery notes, or any other relevant information"
                className="input-field w-full min-h-[120px]"
              />
            </CustomCard>
            
            <CustomCard>
              <h3 className="text-lg font-medium mb-4">Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{currencySymbol}{subTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-border pt-4 flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-lg">{currencySymbol}{total.toFixed(2)}</span>
                </div>
              </div>
            </CustomCard>
          </div>
        </form>
        
        <AddClientModal 
          isOpen={isAddClientModalOpen}
          onClose={() => setIsAddClientModalOpen(false)}
          onAddClient={handleAddClient}
        />
      </div>
    </MainLayout>
  );
};

export default NewInvoice;
