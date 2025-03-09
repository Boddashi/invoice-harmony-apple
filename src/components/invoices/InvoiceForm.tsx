
import React, { useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import CustomCard from '../ui/CustomCard';
import { cn } from '@/lib/utils';
import { useCurrency } from '../../contexts/CurrencyContext';

const InvoiceForm = () => {
  const { currencySymbol } = useCurrency();
  const [items, setItems] = useState([
    { description: '', quantity: 1, rate: 0, amount: 0 }
  ]);

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    
    // Update the field
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    
    // Recalculate amount if quantity or rate changed
    if (field === 'quantity' || field === 'rate') {
      const quantity = field === 'quantity' ? Number(value) : Number(newItems[index].quantity);
      const rate = field === 'rate' ? Number(value) : Number(newItems[index].rate);
      newItems[index].amount = quantity * rate;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + Number(item.amount), 0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <CustomCard>
        <h2 className="text-lg font-semibold mb-4">Client Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Client Name</label>
            <div className="relative">
              <select className="input-field w-full appearance-none pr-10">
                <option>Select a client</option>
                <option>Apple Inc.</option>
                <option>Microsoft Corp.</option>
                <option>Google LLC</option>
                <option>Amazon.com Inc.</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Invoice Number</label>
            <input type="text" defaultValue="INV-006" className="input-field w-full" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Country</label>
            <div className="relative">
              <select className="input-field w-full appearance-none pr-10">
                <option>Select a country</option>
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Canada</option>
                <option>Australia</option>
                <option>Germany</option>
                <option>France</option>
                <option>Japan</option>
                <option>China</option>
                <option>India</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">VAT Number</label>
            <input type="text" placeholder="e.g. GB123456789" className="input-field w-full" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Invoice Date</label>
            <input type="date" className="input-field w-full" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Due Date</label>
            <input type="date" className="input-field w-full" />
          </div>
        </div>
      </CustomCard>
      
      <CustomCard>
        <h2 className="text-lg font-semibold mb-4">Invoice Items</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-medium p-2">Description</th>
                <th className="text-right font-medium p-2 w-24">Qty</th>
                <th className="text-right font-medium p-2 w-32">Rate</th>
                <th className="text-right font-medium p-2 w-32">Amount</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-border/60 last:border-0">
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Item description"
                      className="input-field w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.quantity}
                      min={1}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="input-field w-full text-right"
                    />
                  </td>
                  <td className="p-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{currencySymbol}</span>
                      <input
                        type="number"
                        value={item.rate}
                        min={0}
                        step={0.01}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        className="input-field w-full pl-7 text-right"
                      />
                    </div>
                  </td>
                  <td className="p-2 text-right font-medium">
                    {currencySymbol}{item.amount.toFixed(2)}
                  </td>
                  <td className="p-2">
                    <button 
                      onClick={() => removeItem(index)}
                      className="text-muted-foreground hover:text-apple-red transition-colors p-1"
                      disabled={items.length === 1}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <button 
            onClick={addItem}
            className="secondary-button flex items-center gap-1"
          >
            <Plus size={18} />
            <span>Add Item</span>
          </button>
          
          <div className="text-right">
            <div className="flex justify-end gap-10 py-2">
              <span className="font-medium">Subtotal:</span>
              <span className="font-medium">{currencySymbol}{calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-end gap-10 py-2 border-t border-border">
              <span className="font-semibold">Total:</span>
              <span className="font-semibold">{currencySymbol}{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CustomCard>
      
      <CustomCard>
        <h2 className="text-lg font-semibold mb-4">Notes</h2>
        <textarea
          placeholder="Enter any additional notes for this invoice..."
          className="input-field w-full h-24 resize-none"
        ></textarea>
      </CustomCard>
      
      <div className="flex justify-end gap-3">
        <button className="secondary-button">
          Save as Draft
        </button>
        <button className="apple-button">
          Create Invoice
        </button>
      </div>
    </div>
  );
};

export default InvoiceForm;
