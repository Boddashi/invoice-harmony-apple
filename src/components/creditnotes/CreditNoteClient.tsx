
import React from "react";
import CustomCard from "../ui/CustomCard";

interface ClientData {
  name: string;
  email: string;
  street?: string;
  number?: string;
  bus?: string;
  city?: string;
  postcode?: string;
  country?: string;
  vat_number?: string;
  phone?: string;
}

interface CreditNoteClientProps {
  client?: ClientData;
  readOnly?: boolean;
}

const CreditNoteClient: React.FC<CreditNoteClientProps> = ({ 
  client, 
  readOnly = false 
}) => {
  if (!client) {
    return (
      <CustomCard padding="sm" className="p-4">
        <h3 className="text-lg font-medium mb-4">Client</h3>
        <p className="text-xs text-muted-foreground">No client information available</p>
      </CustomCard>
    );
  }

  return (
    <CustomCard padding="sm" className="p-4">
      <h3 className="text-lg font-medium mb-4">Client</h3>
      <div className="text-xs">
        <p className="font-medium">{client.name}</p>
        <p className="text-muted-foreground mt-1">{client.email}</p>
        
        {(client.street || client.city) && (
          <div className="text-muted-foreground mt-1">
            {client.street && (
              <p>
                {client.street} {client.number || ""}{client.bus ? `, ${client.bus}` : ""}
              </p>
            )}
            {(client.postcode || client.city) && (
              <p>
                {client.postcode && client.postcode} {client.city && client.city}
                {client.country && `, ${client.country}`}
              </p>
            )}
          </div>
        )}
        
        <div className="flex flex-wrap gap-x-4 text-muted-foreground mt-1">
          {client.vat_number && (
            <span>VAT: {client.vat_number}</span>
          )}
          {client.phone && (
            <span>☎ {client.phone}</span>
          )}
        </div>
      </div>
    </CustomCard>
  );
};

export default CreditNoteClient;
