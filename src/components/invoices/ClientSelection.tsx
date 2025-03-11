
import React from 'react';
import CustomCard from '../ui/CustomCard';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';

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
      
      <div className="space-y-2">
        <Label htmlFor="client-select" className="text-sm font-medium text-muted-foreground">
          Select Client
        </Label>
        <Select
          value={selectedClientId}
          onValueChange={(value) => {
            if (value === "add-new") {
              setIsAddClientModalOpen(true);
            } else {
              setSelectedClientId(value);
            }
          }}
        >
          <SelectTrigger id="client-select" className="w-full bg-background">
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
              <SelectItem 
                value="add-new" 
                className="text-apple-blue font-medium cursor-pointer hover:bg-accent flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" /> Add New Client
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </CustomCard>
  );
};

export default ClientSelection;
