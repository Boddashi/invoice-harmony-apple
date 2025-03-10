
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash, UserPlus } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import CustomCard from '../components/ui/CustomCard';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AddClientModal from '@/components/clients/AddClientModal';
import AddItemModal from '@/components/items/AddItemModal';

interface Client {
  id: string;
  name: string;
  company: string | null;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

const EditInvoice = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { currencySymbol } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [savedItems, setSavedItems] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add client and item modal states
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  
  // Invoice form state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'draft' | 'pending'>('draft');
  const [notes, setNotes] = useState('');
  
  // Invoice items state
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0, amount: 0 }
  ]);
  
  // Calculated totals
  const [subTotal, setSubTotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);
  
  // Fetch invoice data
  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!user || !invoiceId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch the invoice
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select(`
            *,
            client:clients(*)
          `)
          .eq('id', invoiceId)
          .eq('user_id', user.id)
          .single();
        
        if (invoiceError) {
          throw invoiceError;
        }
        
        if (!invoiceData) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Invoice not found."
          });
          navigate('/invoices');
          return;
        }
        
        // Check if it's a draft invoice
        if (invoiceData.status !== 'draft') {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Only draft invoices can be edited."
          });
          navigate('/invoices');
          return;
        }
        
        // Fetch the invoice items
        const { data: itemsData, error: itemsError } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoiceId);
        
        if (itemsError) {
          throw itemsError;
        }
        
        // Set form data
        setInvoiceNumber(invoiceData.invoice_number);
        setSelectedClientId(invoiceData.client_id);
        setIssueDate(invoiceData.issue_date);
        setDueDate(invoiceData.due_date);
        setStatus(invoiceData.status as 'draft' | 'pending');
        setNotes(invoiceData.notes || '');
        setTaxRate(invoiceData.tax_rate || 0);
        
        // Set items
        const formattedItems = itemsData ? itemsData.map(item => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          amount: Number(item.amount)
        })) : [];
        
        setItems(formattedItems.length > 0 ? formattedItems : [
          { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0, amount: 0 }
        ]);
        
      } catch (error: any) {
        console.error('Error fetching invoice data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to load invoice data."
        });
        navigate('/invoices');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoiceData();
  }, [user, invoiceId, navigate, toast]);
  
  // Fetch clients from Supabase
  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, company')
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
      }
    };
    
    fetchClients();
  }, [user, toast]);
  
  // Fetch saved items from Supabase
  useEffect(() => {
    const fetchSavedItems = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('invoice_items')
          .select(`
            id,
            description,
            quantity,
            unit_price,
            amount,
            invoice_id,
            invoices(user_id)
          `)
          .eq('invoices.user_id', user.id);
        
        if (error) {
          throw error;
        }
        
        // Process the data
        const filteredItems = (data || []).filter(item => item.invoices !== null);
        setSavedItems(filteredItems);
        
      } catch (error: any) {
        console.error('Error fetching saved items:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch saved items."
        });
      }
    };
    
    fetchSavedItems();
  }, [user, toast]);
  
  // Calculate totals whenever items or tax rate change
  useEffect(() => {
    const calculatedSubTotal = items.reduce((sum, item) => sum + item.amount, 0);
    setSubTotal(calculatedSubTotal);
    
    const calculatedTaxAmount = (calculatedSubTotal * taxRate) / 100;
    setTaxAmount(calculatedTaxAmount);
    
    setTotal(calculatedSubTotal + calculatedTaxAmount);
  }, [items, taxRate]);
  
  // Handle adding a new client
  const handleAddClient = async (newClient: any) => {
    if (!user) return;
    
    try {
      // Save the client to Supabase
      const { data, error } = await supabase.from('clients').insert({
        name: newClient.name,
        company: newClient.company,
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
      
      // Add to clients list and select it
      setClients([...clients, data]);
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
  
  // Handle adding a new item
  const handleAddItem = (newItem: InvoiceItem) => {
    setSavedItems([...savedItems, newItem]);
    
    // Add the new item to the current invoice items
    setItems([...items.filter(item => item.description !== ''), newItem]);
  };
  
  // Handle item selection from dropdown
  const handleItemSelection = (itemId: string) => {
    if (itemId === "add-new") {
      setIsAddItemModalOpen(true);
      return;
    }
    
    const selectedItem = savedItems.find(item => item.id === itemId);
    if (selectedItem) {
      // Create a new item with a new ID but same properties
      const newItem = {
        id: crypto.randomUUID(),
        description: selectedItem.description,
        quantity: selectedItem.quantity,
        unit_price: selectedItem.unit_price,
        amount: selectedItem.quantity * selectedItem.unit_price
      };
      
      // Add the selected item to the current items
      setItems([...items.filter(item => item.description !== ''), newItem]);
    }
  };
  
  // Handle item description change
  const handleItemDescriptionChange = (id: string, value: string) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, description: value } : item
      )
    );
  };
  
  // Handle item quantity change
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
  
  // Handle item unit price change
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
  
  // Add a new empty item row
  const handleAddItemRow = () => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0, amount: 0 }
    ]);
  };
  
  // Remove an item
  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !invoiceId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to update an invoice."
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
      
      // Update the invoice
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
        .eq('id', invoiceId)
        .eq('user_id', user.id);
      
      if (invoiceError) {
        throw invoiceError;
      }
      
      // Delete existing invoice items
      const { error: deleteItemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);
      
      if (deleteItemsError) {
        throw deleteItemsError;
      }
      
      // Add updated invoice items
      const invoiceItems = items.map(item => ({
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);
      
      if (itemsError) {
        throw itemsError;
      }
      
      toast({
        title: "Success",
        description: "Invoice updated successfully."
      });
      
      // Navigate back to invoices page
      navigate('/invoices');
      
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update invoice."
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
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
            <h1 className="text-xl font-semibold">Edit Invoice #{invoiceNumber}</h1>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStatus('draft')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                status === 'draft' 
                  ? 'bg-gray-100 text-gray-700' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Save as Draft
            </button>
            
            <button
              type="button"
              onClick={() => {
                setStatus('pending');
                document.getElementById('invoice-form')?.dispatchEvent(
                  new Event('submit', { cancelable: true, bubbles: true })
                );
              }}
              className="apple-button flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update & Send'}
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
                        {client.name} {client.company ? `(${client.company})` : ''}
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
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-1"></div>
              </div>
              
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    {item.description ? (
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemDescriptionChange(item.id, e.target.value)}
                        className="input-field w-full"
                        required
                        readOnly={index < items.length - 1 && items[items.length - 1].description === ''}
                      />
                    ) : (
                      <select
                        value=""
                        onChange={(e) => handleItemSelection(e.target.value)}
                        className="client-select-dropdown w-full"
                      >
                        <option value="">Select an item</option>
                        {savedItems.map(savedItem => (
                          <option key={savedItem.id} value={savedItem.id}>
                            {savedItem.description} ({currencySymbol}{savedItem.unit_price.toFixed(2)})
                          </option>
                        ))}
                        <option value="add-new" className="font-medium text-apple-blue">
                          + Add New Item
                        </option>
                      </select>
                    )}
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
                onClick={handleAddItemRow}
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
                
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">Tax (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="input-field w-20"
                  />
                  <span className="ml-auto font-medium">{currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-border pt-4 flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-lg">{currencySymbol}{total.toFixed(2)}</span>
                </div>
              </div>
            </CustomCard>
          </div>
        </form>
        
        {/* Add Client Modal */}
        <AddClientModal 
          isOpen={isAddClientModalOpen}
          onClose={() => setIsAddClientModalOpen(false)}
          onAddClient={handleAddClient}
        />
        
        {/* Add Item Modal */}
        <AddItemModal
          isOpen={isAddItemModalOpen}
          onClose={() => setIsAddItemModalOpen(false)}
          onItemAdded={handleAddItem}
        />
      </div>
    </MainLayout>
  );
};

export default EditInvoice;
