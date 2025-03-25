
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

  return (
    <CustomCard>
      <h3 className="text-lg font-medium mb-4">Summary</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal:</span>
          <span>
            {currencySymbol}
            {subtotal.toFixed(2)}
          </span>
        </div>

        {vatGroups.map((group, index) => (
          <div key={index} className="flex justify-between">
            <span className="text-muted-foreground">
              VAT {group.rate}:
            </span>
            <span>
              {currencySymbol}
              {group.amount.toFixed(2)}
            </span>
          </div>
        ))}

        <div className="border-t border-border pt-3 flex justify-between font-bold">
          <span>Total:</span>
          <span>
            {currencySymbol}
            {total.toFixed(2)}
          </span>
        </div>
      </div>
    </CustomCard>
  );
};

export default CreditNoteSummary;
