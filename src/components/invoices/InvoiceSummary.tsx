
import React from 'react';
import CustomCard from '../ui/CustomCard';

interface VatGroup {
  rate: string;
  subtotal: number;
  vat: number;
}

interface InvoiceSummaryProps {
  vatGroups: VatGroup[];
  total: number;
  currencySymbol: string;
}

const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({ vatGroups, total, currencySymbol }) => {
  // Calculate the correct total from the VAT groups
  const calculatedSubtotal = vatGroups.reduce((acc, group) => acc + group.subtotal, 0);
  const calculatedVatTotal = vatGroups.reduce((acc, group) => acc + group.vat, 0);
  const calculatedTotal = calculatedSubtotal + calculatedVatTotal;

  return (
    <CustomCard>
      <h3 className="text-lg font-medium mb-4">Summary</h3>
      
      <div className="space-y-4">
        {vatGroups.map((group, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal ({group.rate})</span>
              <span className="font-medium">{currencySymbol}{group.subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground pl-0">VAT {group.rate}</span>
              <span className="font-medium">{currencySymbol}{group.vat.toFixed(2)}</span>
            </div>
          </div>
        ))}
        
        <div className="border-t border-border pt-4 flex justify-between">
          <span className="font-medium">Total</span>
          <span className="font-bold text-lg">{currencySymbol}{calculatedTotal.toFixed(2)}</span>
        </div>
      </div>
    </CustomCard>
  );
};

export default InvoiceSummary;
