
import React from "react";
import { Trash, Plus } from "lucide-react";
import CustomCard from "../ui/CustomCard";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import AddItemModal from "../items/AddItemModal";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

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
  onItemAdded: () => void;
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
  handleRemoveItem,
  onItemAdded,
}) => {
  return (
    <CustomCard>
      <h3 className="text-lg font-medium mb-4">Items</h3>

      <div className="space-y-6">
        {/* Table headers - visible only on tablet and larger screens */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 font-medium text-muted-foreground text-sm">
          <div className="col-span-4">Item</div>
          <div className="col-span-2">Quantity</div>
          <div className="col-span-2">Unit Price</div>
          <div className="col-span-2">VAT</div>
          <div className="col-span-1">Amount</div>
          <div className="col-span-1"></div>
        </div>

        {/* Item rows */}
        {items.map((item) => (
          <div key={item.id} className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 md:items-center border-b pb-4 md:pb-2 md:border-0">
            {/* Mobile view: label + field pairs */}
            <div className="md:hidden text-sm font-medium text-muted-foreground">Item</div>
            <div className="md:col-span-4">
              <Select
                value={item.description}
                onValueChange={(value) =>
                  handleItemDescriptionChange(item.id, value)
                }
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {availableItems.map((availableItem) => (
                      <SelectItem
                        key={availableItem.id}
                        value={availableItem.id}
                      >
                        {availableItem.title} - {currencySymbol}
                        {availableItem.price}
                      </SelectItem>
                    ))}
                    <Separator className="my-2" />
                    <div className="p-2">
                      <AddItemModal
                        onItemAdded={onItemAdded}
                        trigger={
                          <Button
                            variant="apple"
                            className="w-full justify-start select-button"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Item
                          </Button>
                        }
                      />
                    </div>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="md:hidden text-sm font-medium text-muted-foreground mt-2">Quantity</div>
            <div className="md:col-span-2">
              <input
                type="number"
                min="1"
                step="1"
                value={item.quantity}
                onChange={(e) =>
                  handleItemQuantityChange(item.id, Number(e.target.value))
                }
                className="input-field w-full"
                required
              />
            </div>

            <div className="md:hidden text-sm font-medium text-muted-foreground mt-2">Unit Price</div>
            <div className="md:col-span-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) =>
                    handleItemUnitPriceChange(item.id, Number(e.target.value))
                  }
                  className="input-field w-full pl-8"
                  required
                />
              </div>
            </div>

            <div className="md:hidden text-sm font-medium text-muted-foreground mt-2">VAT</div>
            <div className="md:col-span-2">
              <Select
                value={item.vat_rate}
                onValueChange={(value) => handleItemVatChange(item.id, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="VAT" />
                </SelectTrigger>
                <SelectContent>
                  {vats.map((vat) => (
                    <SelectItem key={vat.title} value={vat.title}>
                      {vat.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center md:col-span-1 md:justify-start mt-2 md:mt-0">
              <div className="md:hidden text-sm font-medium text-muted-foreground">Amount</div>
              <div className="font-medium">
                {currencySymbol}
                {item.amount.toFixed(2)}
              </div>
            </div>

            <div className="md:col-span-1 flex justify-end mt-2 md:mt-0">
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
          className="flex items-center gap-2 text-apple-blue hover:text-apple-blue/80 dark:text-apple-purple dark:hover:text-apple-purple/80 font-medium transition-colors mt-4"
        >
          <Plus size={18} />
          <span>Add Item</span>
        </button>
      </div>
    </CustomCard>
  );
};

export default InvoiceItems;
