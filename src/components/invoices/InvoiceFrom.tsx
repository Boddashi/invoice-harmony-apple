
import React from 'react';
import CustomCard from '../ui/CustomCard';

interface InvoiceFromProps {
  userEmail: string | null | undefined;
}

const InvoiceFrom: React.FC<InvoiceFromProps> = ({ userEmail }) => {
  return (
    <CustomCard>
      <h3 className="text-lg font-medium mb-4">From</h3>
      
      <div className="space-y-1">
        <p className="font-medium">{userEmail}</p>
        <p className="text-muted-foreground text-sm">Your business details will appear here</p>
      </div>
    </CustomCard>
  );
};

export default InvoiceFrom;
