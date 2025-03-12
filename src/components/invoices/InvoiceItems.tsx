
import React from 'react';
import { Trash, Plus } from 'lucide-react';
import CustomCard from '../ui/CustomCard';
import { 
  Select, 
  SelectContent, 
  SelectGroup,
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

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

interface Vat {
  title: string;
  amount: number | null;
}

interface InvoiceItemsProps {
  items: InvoiceItem[];
  availableItems: Item[];
  vats: Vat[];
  currencySymbol: string;
  handleItemDescriptionChange: (id: string, value: string) => void;
  handleItemQuantityChange: (id: string, value: number) => void;
  handleItemUnitPriceChange: (id: string, value: number) => void;
  handleItemVatChange: (id: string, value: string) => void;
  handleAddItem: () => void;
  handleRemoveItem: (id: string) => void;
}

const InvoiceItems: React.FC<InvoiceItemsProps> = ({
  items,
  availableItems,
  vats,
  currencySymbol,
  handleItemDescriptionChange,
  handleItemQuantityChange,
  handleItemUnitPriceChange,
  handleItemVatChange,
  handleAddItem,
  handleRemoveItem
}) => {
  return (
    <CustomCard>
      <h3 className="text-lg font-medium mb-4">Items</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4 font-medium text-muted-foreground text-sm">
          <div className="col-span-4">Item</div>
          <div className="col-span-2">Quantity</div>
          <div className="col-span-2">Unit Price</div>
          <div className="col-span-2">VAT</div>
          <div className="col-span-1">Amount</div>
          <div className="col-span-1"></div>
        </div>
        
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4">
              <Select
                value={item.description}
                onValueChange={(value) => handleItemDescriptionChange(item.id, value)}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {availableItems.map(availableItem => (
                      <SelectItem key={availableItem.id} value={availableItem.id}>
                        {availableItem.title} - {currencySymbol}{availableItem.price}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2">
              <input 
                type="number" 
                min="1" 
                step="1" 
                value={item.quantity} 
                onChange={e => handleItemQuantityChange(item.id, Number(e.target.value))} 
                className="input-field w-full" 
                required 
              />
            </div>
            
            <div className="col-span-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  {currencySymbol}
                </span>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={item.unit_price} 
                  onChange={e => handleItemUnitPriceChange(item.id, Number(e.target.value))} 
                  className="input-field w-full pl-8" 
                  required 
                />
              </div>
            </div>

            <div className="col-span-2">
              <Select 
                value={item.vat_rate} 
                onValueChange={value => handleItemVatChange(item.id, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="VAT" />
                </SelectTrigger>
                <SelectContent>
                  {vats.map(vat => (
                    <SelectItem key={vat.title} value={vat.title}>
                      {vat.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-1 font-medium">
              {currencySymbol}{item.amount.toFixed(2)}
            </div>
            
            <div className="col-span-1 text-right">
              <button 
                type="button" 
                onClick={() => handleRemoveItem(item.id)} 
                className="text-muted-foreground hover:text-destructive transition-colors" 
                disabled={items.length === 1}
              >
                <Trash size={18} />
              </button>
            </div>
          </div>
        ))}
        
        <button 
          type="button" 
          onClick={handleAddItem} 
          className="flex items-center gap-2 text-apple-blue hover:text-apple-blue/80 font-medium transition-colors"
        >
          <Plus size={18} />
          <span>Add Item</span>
        </button>
      </div>
    </CustomCard>
  );
};

export default InvoiceItems;
