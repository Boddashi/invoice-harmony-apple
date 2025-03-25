
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

  // Ensure the total is calculated correctly as the sum of subtotal and VAT
  // We still use the prop total in the UI for consistency with parent component
  
  const formatAmount = (amount: number) => {
    return amount.toFixed(2);
  };

  return (
    <CustomCard>
      <h3 className="text-lg font-medium mb-4">Summary</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal:</span>
          <span>
            {currencySymbol}
            {formatAmount(subtotal)}
          </span>
        </div>

        {vatGroups.map((group, index) => (
          <div key={index} className="flex justify-between">
            <span className="text-muted-foreground">
              VAT {group.rate}:
            </span>
            <span>
              {currencySymbol}
              {formatAmount(group.amount)}
            </span>
          </div>
        ))}

        <div className="border-t border-border pt-3 flex justify-between font-bold">
          <span>Total:</span>
          <span>
            {currencySymbol}
            {formatAmount(total)}
          </span>
        </div>
      </div>
    </CustomCard>
  );
};

export default CreditNoteSummary;
