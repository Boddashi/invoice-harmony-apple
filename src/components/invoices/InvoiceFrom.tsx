
import React from 'react';
import CustomCard from '../ui/CustomCard';

interface InvoiceFromProps {
  userEmail: string | null | undefined;
  readOnly?: boolean;
}

const InvoiceFrom: React.FC<InvoiceFromProps> = ({ userEmail, readOnly = false }) => {
  return (
    <CustomCard>
      <h3 className="text-lg font-medium mb-4">From</h3>
      
      <div className="space-y-1">
        <p className="font-medium">{userEmail}</p>
        {!readOnly && (
          <p className="text-muted-foreground text-sm">Your business details will appear here</p>
        )}
      </div>
    </CustomCard>
  );
};

export default InvoiceFrom;
