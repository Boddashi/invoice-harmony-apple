import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, Calendar, ChevronsUpDown,
  Download, Send, Save, Eye
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import AddClientModal from '@/components/clients/AddClientModal';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface InvoiceFormData {
  invoice_number: string;
  client_id: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total_amount: number;
  notes: string;
  items: InvoiceItem[];
}

const initialInvoiceData: InvoiceFormData = {
  invoice_number: '',
  client_id: '',
  issue_date: format(new Date(), 'yyyy-MM-dd'),
  due_date: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  status: 'draft',
  subtotal: 0,
  tax_rate: 0,
  tax_amount: 0,
  discount: 0,
  total_amount: 0,
  notes: '',
  items: [
    {
      id: '1',
      description: '',
      quantity: 1,
      price: 0,
      total: 0
    }
  ]
};

const NewInvoice = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const isNewInvoice = !invoiceId;
  
  const [invoiceData, setInvoiceData] = useState<InvoiceFormData>(initialInvoiceData);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('clients')
          .select('*')
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

  const handleSaveInvoice = async (status: InvoiceFormData['status']) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const invoiceToSave = {
        ...invoiceData,
        user_id: user.id,
        status: status,
      };
      
      if (isNewInvoice) {
        const { data, error } = await supabase
          .from('invoices')
          .insert([invoiceToSave])
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        toast({
          title: "Success",
          description: "Invoice created successfully."
        });
        
        navigate(`/invoices/${data.id}`);
      } else {
        const { error } = await supabase
          .from('invoices')
          .update(invoiceToSave)
          .eq('id', invoiceId);
        
        if (error) {
          throw error;
        }
        
        toast({
          title: "Success",
          description: "Invoice updated successfully."
        });
      }
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save invoice."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const calculateTotals = () => {
      let subtotal = 0;
      invoiceData.items.forEach(item => {
        subtotal += item.quantity * item.price;
      });
      
      const taxAmount = subtotal * (invoiceData.tax_rate / 100);
      const totalAmount = subtotal + taxAmount - invoiceData.discount;
      
      setInvoiceData(prevData => ({
        ...prevData,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount
      }));
    };
    
    calculateTotals();
  }, [invoiceData.items, invoiceData.tax_rate, invoiceData.discount]);

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...invoiceData.items];
    updatedItems[index][field] = value;
    
    if (field === 'quantity' || field === 'price') {
      const quantity = field === 'quantity' ? value : updatedItems[index].quantity;
      const price = field === 'price' ? value : updatedItems[index].price;
      updatedItems[index].total = quantity * price;
    }
    
    setInvoiceData({
      ...invoiceData,
      items: updatedItems
    });
  };

  const handleAddItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [
        ...invoiceData.items,
        {
          id: String(Date.now()),
          description: '',
          quantity: 1,
          price: 0,
          total: 0
        }
      ]
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...invoiceData.items];
    updatedItems.splice(index, 1);
    
    setInvoiceData({
      ...invoiceData,
      items: updatedItems
    });
  };

  const handleClientSelect = (clientId: string) => {
    setInvoiceData({
      ...invoiceData,
      client_id: clientId
    });
    
    const selected = clients.find(client => client.id === clientId);
    setSelectedClient(selected || null);
  };

  const handleAddNewClient = (newClient: Client) => {
    setClients([...clients, newClient]);
    setInvoiceData({
      ...invoiceData,
      client_id: newClient.id
    });
    setSelectedClient(newClient);
  };

  const downloadInvoice = () => {
    toast({
      title: "Download",
      description: "Download is not implemented yet."
    });
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto pb-10">
        <div className="flex justify-between items-center mb-8">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => navigate('/invoices')}
          >
            <ArrowLeft size={16} />
            <span>Back to Invoices</span>
          </Button>
          
          <div className="flex items-center gap-2">
            {!isNewInvoice && (
              <>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={downloadInvoice}
                >
                  <Download size={16} />
                  <span>Download</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => navigate(`/invoice/${invoiceId}/preview`)}
                >
                  <Eye size={16} />
                  <span>Preview</span>
                </Button>
              </>
            )}
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => handleSaveInvoice('draft')}
            >
              <Save size={16} />
              <span>Save as Draft</span>
            </Button>
            
            <Button 
              className="flex items-center gap-2 bg-apple-blue hover:bg-apple-blue/90"
              onClick={() => handleSaveInvoice('pending')}
            >
              <Send size={16} />
              <span>Save & Send</span>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold">Invoice Information</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Invoice Number</label>
                  <Input 
                    value={invoiceData.invoice_number}
                    onChange={(e) => setInvoiceData({...invoiceData, invoice_number: e.target.value})}
                    placeholder="INV-001"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    value={invoiceData.status}
                    onValueChange={(value: any) => setInvoiceData({
                      ...invoiceData, 
                      status: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Issue Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !invoiceData.issue_date && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {invoiceData.issue_date ? format(new Date(invoiceData.issue_date), 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={invoiceData.issue_date ? new Date(invoiceData.issue_date) : undefined}
                        onSelect={(date) => date && setInvoiceData({
                          ...invoiceData, 
                          issue_date: format(date, 'yyyy-MM-dd')
                        })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !invoiceData.due_date && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {invoiceData.due_date ? format(new Date(invoiceData.due_date), 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={invoiceData.due_date ? new Date(invoiceData.due_date) : undefined}
                        onSelect={(date) => date && setInvoiceData({
                          ...invoiceData, 
                          due_date: format(date, 'yyyy-MM-dd')
                        })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Client</h2>
                <Button 
                  variant="ghost" 
                  className="text-apple-blue h-8 px-2"
                  onClick={() => setShowAddClientModal(true)}
                >
                  <Plus size={16} className="mr-1" />
                  Add New Client
                </Button>
              </div>
              
              <div>
                <Select 
                  value={invoiceData.client_id}
                  onValueChange={handleClientSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedClient && (
                <div className="text-sm space-y-1 mt-4">
                  <p className="font-medium">{selectedClient.name}</p>
                  <p>{selectedClient.email}</p>
                  {selectedClient.phone && <p>{selectedClient.phone}</p>}
                  {selectedClient.address && <p>{selectedClient.address}</p>}
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold">Notes</h2>
              <Textarea 
                placeholder="Add any notes or terms for the client..."
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData({...invoiceData, notes: e.target.value})}
                className="min-h-32"
              />
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold">Items</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-2 text-sm font-medium">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2">Qty</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-2">Total</div>
                  <div className="col-span-1"></div>
                </div>
                
                {invoiceData.items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <Input 
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input 
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input 
                        type="number"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input 
                        value={item.total.toFixed(2)}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      {invoiceData.items.length > 1 && (
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 size={14} className="text-gray-500 hover:text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-1 mt-2"
                  onClick={handleAddItem}
                >
                  <Plus size={14} />
                  <span>Add Item</span>
                </Button>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold">Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal:</span>
                  <span>{currencyFormat(invoiceData.subtotal)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Tax Rate:</span>
                    <Input 
                      type="number"
                      value={invoiceData.tax_rate}
                      onChange={(e) => setInvoiceData({
                        ...invoiceData, 
                        tax_rate: parseFloat(e.target.value) || 0
                      })}
                      className="w-20 h-8"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                  <span>{currencyFormat(invoiceData.tax_amount)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Discount:</span>
                    <Input 
                      type="number"
                      value={invoiceData.discount}
                      onChange={(e) => setInvoiceData({
                        ...invoiceData, 
                        discount: parseFloat(e.target.value) || 0
                      })}
                      className="w-20 h-8"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <span>-{currencyFormat(invoiceData.discount)}</span>
                </div>
                
                <div className="border-t pt-3 flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-lg">{currencyFormat(invoiceData.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showAddClientModal && (
        <AddClientModal
          isOpen={showAddClientModal}
          onClose={() => setShowAddClientModal(false)}
          onAddClient={handleAddNewClient}
        />
      )}
    </MainLayout>
  );
};

const currencyFormat = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default NewInvoice;
