
import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Plus, Mail, Phone } from 'lucide-react';
import CustomCard from '../ui/CustomCard';
import AddClientModal from './AddClientModal';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Client {
  id: string;
  type: string;
  name: string;
  email: string;
  phone: string | null;
  street?: string | null;
  number?: string | null;
  bus?: string | null;
  postcode?: string | null;
  city?: string | null;
  country?: string | null;
  vat_number?: string | null;
  vatNumber?: string | null;
  invoices?: number;
  totalSpent?: number;
}

const ClientList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currencySymbol } = useCurrency();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Format amount with currency symbol
  const formatAmount = (amount: number | string) => {
    if (typeof amount === 'string') {
      return amount;
    }
    return `${currencySymbol}${amount.toFixed(2)}`;
  };
  
  // Fetch clients and their invoice data from Supabase
  useEffect(() => {
    const fetchClientsWithInvoiceData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // First, fetch all clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id);
        
        if (clientsError) {
          throw clientsError;
        }
        
        // Then fetch invoice data for all clients
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select('client_id, total_amount')
          .eq('user_id', user.id);
        
        if (invoicesError) {
          throw invoicesError;
        }
        
        // Calculate the invoice counts and total spent for each client
        const clientInvoiceMap = new Map();
        
        invoicesData.forEach(invoice => {
          const clientId = invoice.client_id;
          if (!clientInvoiceMap.has(clientId)) {
            clientInvoiceMap.set(clientId, {
              count: 0,
              total: 0
            });
          }
          
          const clientData = clientInvoiceMap.get(clientId);
          clientData.count += 1;
          // Fix: Parse the total_amount as a number before adding it
          clientData.total += Number(invoice.total_amount);
          clientInvoiceMap.set(clientId, clientData);
        });
        
        // Transform the clients data to include invoice information
        const transformedData = clientsData.map(client => {
          const invoiceData = clientInvoiceMap.get(client.id) || { count: 0, total: 0 };
          
          return {
            ...client,
            vatNumber: client.vat_number,
            invoices: invoiceData.count,
            totalSpent: invoiceData.total
          };
        });
        
        setClients(transformedData);
      } catch (error: any) {
        console.error('Error fetching clients with invoice data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch clients."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClientsWithInvoiceData();
  }, [user, toast]);

  const handleAddClient = async (newClient: any) => {
    try {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to add clients."
        });
        return;
      }
      
      const clientData = {
        user_id: user.id,
        type: newClient.type,
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone || null,
        street: newClient.street || null,
        number: newClient.number || null,
        bus: newClient.bus || null,
        postcode: newClient.postcode || null,
        city: newClient.city || null,
        country: newClient.country || null,
        vat_number: newClient.vatNumber || null
      };
      
      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const clientWithInvoiceData = {
          ...data,
          vatNumber: data.vat_number,
          invoices: 0,
          totalSpent: 0
        };
        
        setClients([...clients, clientWithInvoiceData]);
      }
      
      toast({
        title: "Success",
        description: "Client added successfully."
      });
    } catch (error: any) {
      console.error('Error adding client:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add client."
      });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Clients</h2>
        <button 
          className="apple-button flex items-center gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} />
          <span>Add Client</span>
        </button>
      </div>
      
      <CustomCard padding="none">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No clients found. Add your first client to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-secondary/50 text-foreground text-left">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Contact</th>
                  <th className="p-4 font-medium">Address</th>
                  <th className="p-4 font-medium text-right">Invoices</th>
                  <th className="p-4 font-medium text-right">Total Spent</th>
                  <th className="p-4 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{client.name}</span>
                        {client.type === 'business' && client.vat_number && (
                          <span className="text-xs text-muted-foreground mt-1">VAT: {client.vat_number}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-muted-foreground" />
                          <span className="text-sm">{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2 mt-1">
                            <Phone size={14} className="text-muted-foreground" />
                            <span className="text-sm">{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col text-sm">
                        {client.street && (
                          <span>{client.street} {client.number} {client.bus}</span>
                        )}
                        {client.postcode && client.city && (
                          <span>{client.postcode} {client.city}</span>
                        )}
                        {client.country && (
                          <span className="text-muted-foreground">{client.country}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">{client.invoices}</td>
                    <td className="p-4 text-right font-medium">
                      {client.totalSpent !== undefined ? formatAmount(client.totalSpent) : '$0.00'}
                    </td>
                    <td className="p-4">
                      <button className="p-2 rounded-full hover:bg-secondary transition-colors">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CustomCard>

      <AddClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAddClient={handleAddClient} 
      />
    </div>
  );
};

export default ClientList;
