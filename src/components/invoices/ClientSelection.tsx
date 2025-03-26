
import React, { useEffect } from "react";
import CustomCard from "../ui/CustomCard";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
  setIsAddClientModalOpen,
}) => {
  // Set first client automatically if there are clients and no selection yet
  useEffect(() => {
    if (clients.length > 0 && !selectedClientId && setSelectedClientId) {
      console.log("Auto-selecting first client:", clients[0].id);
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId, setSelectedClientId]);

  return (
    <CustomCard>
      <h3 className="text-lg font-medium mb-4">Client</h3>

      <div className="space-y-2">
        <Label
          htmlFor="client-select"
          className="text-sm font-medium text-muted-foreground"
        >
          Select Client
        </Label>
        <Select
          value={selectedClientId || ""}
          onValueChange={(value) => {
            console.log("Client selected:", value);
            setSelectedClientId(value);
          }}
        >
          <SelectTrigger id="client-select" className="w-full bg-background">
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <div className="px-2 py-1.5">
              <Button
                variant="apple"
                className="w-full justify-start select-button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // Prevent event bubbling
                  setIsAddClientModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Add New Client
              </Button>
            </div>
          </SelectContent>
        </Select>
      </div>
    </CustomCard>
  );
};

export default ClientSelection;
