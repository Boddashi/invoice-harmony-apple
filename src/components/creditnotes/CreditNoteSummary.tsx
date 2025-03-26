
import React from "react";
import CustomCard from "../ui/CustomCard";

interface VatGroup {
  rate: string;
  value: number;
  amount: number;
}

interface CreditNoteSummaryProps {
  vatGroups: VatGroup[];
  total: number;
  currencySymbol: string;
}

const CreditNoteSummary: React.FC<CreditNoteSummaryProps> = ({
  vatGroups,
  total,
  currencySymbol,
}) => {
  const subtotal = vatGroups.reduce((acc, group) => acc + group.value, 0);
  const vatTotal = vatGroups.reduce((acc, group) => acc + group.amount, 0);
  
  // Calculate the correct total (sum of subtotal and VAT)
  const calculatedTotal = subtotal + vatTotal;
  
  const formatAmount = (amount: number) => {
    return amount.toFixed(2);
  };

  return (
    <CustomCard>
      <h3 className="text-lg font-medium mb-4">Summary</h3>
      
      <div className="space-y-4">
        {vatGroups.map((group, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal ({group.rate})</span>
              <span className="font-medium">{currencySymbol}{formatAmount(group.value)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground pl-0">VAT {group.rate}</span>
              <span className="font-medium">{currencySymbol}{formatAmount(group.amount)}</span>
            </div>
          </div>
        ))}
        
        <div className="border-t border-border pt-4 flex justify-between">
          <span className="font-medium">Total</span>
          <span className="font-bold text-lg">{currencySymbol}{formatAmount(calculatedTotal)}</span>
        </div>
      </div>
    </CustomCard>
  );
};

export default CreditNoteSummary;
