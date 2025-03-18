
import React from 'react';
import CustomCard from '../ui/CustomCard';

interface Item {
  id: string;
  title: string;
  price: number;
  vat: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  vat_rate: string;
}

interface InvoiceItemsReadOnlyProps {
  items: InvoiceItem[];
  availableItems: Item[];
  currencySymbol: string;
}

const InvoiceItemsReadOnly: React.FC<InvoiceItemsReadOnlyProps> = ({
  items,
  availableItems,
  currencySymbol
}) => {
  const getItemTitle = (itemId: string) => {
    const item = availableItems.find(i => i.id === itemId);
    return item?.title || itemId;
  };

  return (
    <CustomCard>
      <h3 className="text-lg font-medium mb-4">Items</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4 font-medium text-muted-foreground text-sm">
          <div className="col-span-5">Item</div>
          <div className="col-span-2">Quantity</div>
          <div className="col-span-2">Unit Price</div>
          <div className="col-span-2">VAT</div>
          <div className="col-span-1 text-right">Amount</div>
        </div>
        
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-4 items-center py-2 border-b border-gray-100 last:border-0">
            <div className="col-span-5 font-medium">
              {getItemTitle(item.description)}
            </div>
            
            <div className="col-span-2">
              {item.quantity}
            </div>
            
            <div className="col-span-2">
              {currencySymbol}{item.unit_price.toFixed(2)}
            </div>

            <div className="col-span-2">
              {item.vat_rate}
            </div>
            
            <div className="col-span-1 font-medium text-right">
              {currencySymbol}{item.amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </CustomCard>
  );
};

export default InvoiceItemsReadOnly;
