
import React, { useState, useEffect } from 'react';
import { Mail, Phone } from 'lucide-react';
import CustomCard from '../ui/CustomCard';
import AddClientModal from './AddClientModal';
import ClientActions from './ClientActions';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

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
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
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
  const fetchClients = async () => {
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
  
  useEffect(() => {
    fetchClients();
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

  const handleUpdateClient = async (updatedClient: any) => {
    try {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to update clients."
        });
        return;
      }
      
      const clientData = {
        user_id: user.id,
        type: updatedClient.type,
        name: updatedClient.name,
        email: updatedClient.email,
        phone: updatedClient.phone || null,
        street: updatedClient.street || null,
        number: updatedClient.number || null,
        bus: updatedClient.bus || null,
        postcode: updatedClient.postcode || null,
        city: updatedClient.city || null,
        country: updatedClient.country || null,
        vat_number: updatedClient.vatNumber || null
      };
      
      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', updatedClient.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Find the updated client's invoice data
        const existingClient = clients.find(c => c.id === updatedClient.id);
        const clientWithInvoiceData = {
          ...data,
          vatNumber: data.vat_number,
          invoices: existingClient?.invoices || 0,
          totalSpent: existingClient?.totalSpent || 0
        };
        
        // Update the clients list
        setClients(clients.map(client => 
          client.id === updatedClient.id ? clientWithInvoiceData : client
        ));
      }
      
      toast({
        title: "Success",
        description: "Client updated successfully."
      });
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update client."
      });
    }
  };

  const handleEditClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setClientToEdit(client);
      setIsModalOpen(true);
    }
  };

  const handleOpenModal = () => {
    setClientToEdit(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setClientToEdit(null);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Clients</h2>
        <Button 
          className="gap-2"
          onClick={handleOpenModal}
        >
          <Plus size={18} />
          <span>Add Client</span>
        </Button>
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
                      <ClientActions 
                        clientId={client.id} 
                        onEditClient={handleEditClient}
                        onClientDeleted={fetchClients}
                      />
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
        onClose={handleCloseModal} 
        onAddClient={handleAddClient}
        onUpdateClient={handleUpdateClient}
        clientToEdit={clientToEdit}
      />
    </div>
  );
};

export default ClientList;
