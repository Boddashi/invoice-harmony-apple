
import React from 'react';
import { MoreHorizontal, Plus, Mail, Phone } from 'lucide-react';
import CustomCard from '../ui/CustomCard';

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  invoices: number;
  totalSpent: string;
}

const ClientList = () => {
  // Mock data
  const clients: Client[] = [
    {
      id: '1',
      name: 'Tim Cook',
      company: 'Apple Inc.',
      email: 'tim@apple.com',
      phone: '(123) 456-7890',
      invoices: 5,
      totalSpent: '$12,350'
    },
    {
      id: '2',
      name: 'Satya Nadella',
      company: 'Microsoft Corp.',
      email: 'satya@microsoft.com',
      phone: '(234) 567-8901',
      invoices: 3,
      totalSpent: '$6,840'
    },
    {
      id: '3',
      name: 'Sundar Pichai',
      company: 'Google LLC',
      email: 'sundar@google.com',
      phone: '(345) 678-9012',
      invoices: 4,
      totalSpent: '$9,200'
    },
    {
      id: '4',
      name: 'Andy Jassy',
      company: 'Amazon.com Inc.',
      email: 'andy@amazon.com',
      phone: '(456) 789-0123',
      invoices: 2,
      totalSpent: '$4,500'
    },
    {
      id: '5',
      name: 'Elon Musk',
      company: 'Tesla Inc.',
      email: 'elon@tesla.com',
      phone: '(567) 890-1234',
      invoices: 1,
      totalSpent: '$2,800'
    }
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Clients</h2>
        <button className="apple-button flex items-center gap-2">
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
                      <span className="text-sm text-muted-foreground">{client.company}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-muted-foreground" />
                        <span className="text-sm">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone size={14} className="text-muted-foreground" />
                        <span className="text-sm">{client.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">{client.invoices}</td>
                  <td className="p-4 text-right font-medium">{client.totalSpent}</td>
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
    </div>
  );
};

export default ClientList;
