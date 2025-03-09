import React, { useState } from 'react';
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
  company: string;
  email: string;
  phone: string;
  street?: string;
  number?: string;
  bus?: string;
  postcode?: string;
  city?: string;
  country?: string;
  vatNumber?: string;
  invoices: number;
  totalSpent: number | string;
}

const ClientList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  
  // Mock data
  const [clients, setClients] = useState<Client[]>([
    {
      id: '1',
      type: 'business',
      name: 'Tim Cook',
      company: 'Apple Inc.',
      email: 'tim@apple.com',
      phone: '(123) 456-7890',
      street: '1 Apple Park Way',
      city: 'Cupertino',
      postcode: '95014',
      country: 'United States',
      vatNumber: 'US123456789',
      invoices: 5,
      totalSpent: 12350
    },
    {
      id: '2',
      type: 'business',
      name: 'Satya Nadella',
      company: 'Microsoft Corp.',
      email: 'satya@microsoft.com',
      phone: '(234) 567-8901',
      invoices: 3,
      totalSpent: 6840
    },
    {
      id: '3',
      type: 'business',
      name: 'Sundar Pichai',
      company: 'Google LLC',
      email: 'sundar@google.com',
      phone: '(345) 678-9012',
      invoices: 4,
      totalSpent: 9200
    },
    {
      id: '4',
      type: 'business',
      name: 'Andy Jassy',
      company: 'Amazon.com Inc.',
      email: 'andy@amazon.com',
      phone: '(456) 789-0123',
      invoices: 2,
      totalSpent: 4500
    },
    {
      id: '5',
      type: 'individual',
      name: 'Elon Musk',
      company: '',
      email: 'elon@tesla.com',
      phone: '(567) 890-1234',
      invoices: 1,
      totalSpent: 2800
    }
  ]);

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
        company: newClient.company || null,
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

      const clientWithInvoiceData = {
        ...data,
        vatNumber: data.vat_number,
        invoices: 0,
        totalSpent: '$0'
      };

      setClients([...clients, clientWithInvoiceData]);
      
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
                      {client.company && <span className="text-sm text-muted-foreground">{client.company}</span>}
                      {client.type === 'business' && client.vatNumber && (
                        <span className="text-xs text-muted-foreground mt-1">VAT: {client.vatNumber}</span>
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
                  <td className="p-4 text-right font-medium">{formatAmount(client.totalSpent)}</td>
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
