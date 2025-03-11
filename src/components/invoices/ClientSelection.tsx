
import React from 'react';
import CustomCard from '../ui/CustomCard';

interface Client {
  id: string;
  name: string;
}

interface ClientSelectionProps {
  clients: Client[];
  selectedClientId: string;
  setSelectedClientId: (value: string) => void;
  setIsAddClientModalOpen: (value: boolean) => void;
}

const ClientSelection: React.FC<ClientSelectionProps> = ({
  clients,
  selectedClientId,
  setSelectedClientId,
  setIsAddClientModalOpen
}) => {
  return (
    <CustomCard>
      <h3 className="text-lg font-medium mb-4">Client</h3>
      
      <div className="space-y-1">
        <label className="block text-sm font-medium text-muted-foreground">Select Client</label>
        <div className="relative">
          <select 
            value={selectedClientId} 
            onChange={e => {
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
  );
};

export default ClientSelection;
