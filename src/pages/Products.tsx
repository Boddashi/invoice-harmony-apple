
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CustomCard from '@/components/ui/CustomCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Plus, Save, X } from 'lucide-react';
import AddItemModal from '@/components/items/AddItemModal';
import { toast } from 'sonner';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

const Items = () => {
  const { user } = useAuth();
  const { currencySymbol } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  
  // State for editing
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<InvoiceItem>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchItems = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch items from invoice_items
      const { data, error } = await supabase
        .from('invoice_items')
        .select(`
          id,
          description,
          quantity,
          unit_price,
          amount,
          invoice_id,
          invoices(user_id)
        `)
        .eq('invoices.user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Process the data
      const filteredItems = (data || []).filter(item => item.invoices !== null);
      setItems(filteredItems);
      
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchItems();
  }, [user]);
  
  const handleItemAdded = () => {
    fetchItems();
  };

  // Start editing an item
  const startEditing = (item: InvoiceItem) => {
    setEditingItemId(item.id);
    setEditValues({
      description: item.description,
      unit_price: item.unit_price,
      quantity: item.quantity
    });
  };

  // Handle input change during editing
  const handleEditChange = (field: keyof InvoiceItem, value: string | number) => {
    setEditValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate amount based on quantity and unit price
  const calculateAmount = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  // Save the edited item
  const saveItem = async () => {
    if (!editingItemId || !editValues) return;
    
    try {
      setIsSaving(true);
      
      // Calculate the new amount
      const quantity = Number(editValues.quantity);
      const unitPrice = Number(editValues.unit_price);
      const amount = calculateAmount(quantity, unitPrice);
      
      // Update the item in the database
      const { error } = await supabase
        .from('invoice_items')
        .update({
          description: editValues.description,
          unit_price: unitPrice,
          quantity: quantity,
          amount: amount
        })
        .eq('id', editingItemId);
      
      if (error) throw error;
      
      // Update local state
      setItems(items.map(item => 
        item.id === editingItemId 
          ? { 
              ...item, 
              description: editValues.description || item.description,
              unit_price: unitPrice,
              quantity: quantity,
              amount: amount
            } 
          : item
      ));
      
      toast.success('Item updated successfully');
      
      // Reset editing state
      setEditingItemId(null);
      setEditValues({});
      
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast.error(error.message || 'Failed to update item');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingItemId(null);
    setEditValues({});
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Items</h1>
          <button 
            onClick={() => setIsAddItemModalOpen(true)}
            className="apple-button flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Add Item</span>
          </button>
        </div>
        
        <CustomCard>
          {loading ? (
            <div className="py-12 text-center">Loading items...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No items found.</p>
              <p className="mt-2">Create an invoice with items to see them here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="py-3 px-4 font-medium">Description</th>
                    <th className="py-3 px-4 font-medium text-right">Unit Price</th>
                    <th className="py-3 px-4 font-medium text-right">Quantity</th>
                    <th className="py-3 px-4 font-medium text-right">Total Amount</th>
                    <th className="py-3 px-4 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-3 px-4">
                        {editingItemId === item.id ? (
                          <input 
                            type="text"
                            value={editValues.description}
                            onChange={(e) => handleEditChange('description', e.target.value)}
                            className="input-field w-full"
                          />
                        ) : (
                          <div onClick={() => startEditing(item)} className="cursor-pointer hover:text-apple-blue">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingItemId === item.id ? (
                          <input 
                            type="number"
                            min="0"
                            step="0.01"
                            value={editValues.unit_price}
                            onChange={(e) => handleEditChange('unit_price', e.target.value)}
                            className="input-field w-full text-right"
                          />
                        ) : (
                          <div onClick={() => startEditing(item)} className="cursor-pointer hover:text-apple-blue">
                            {currencySymbol}{item.unit_price.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingItemId === item.id ? (
                          <input 
                            type="number"
                            min="1"
                            step="1"
                            value={editValues.quantity}
                            onChange={(e) => handleEditChange('quantity', e.target.value)}
                            className="input-field w-full text-right"
                          />
                        ) : (
                          <div onClick={() => startEditing(item)} className="cursor-pointer hover:text-apple-blue">
                            {item.quantity}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {editingItemId === item.id ? (
                          currencySymbol + (
                            (Number(editValues.quantity) || 0) * 
                            (Number(editValues.unit_price) || 0)
                          ).toFixed(2)
                        ) : (
                          <div onClick={() => startEditing(item)} className="cursor-pointer hover:text-apple-blue">
                            {currencySymbol}{item.amount.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingItemId === item.id ? (
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={saveItem}
                              disabled={isSaving}
                              className="p-1 text-green-600 hover:text-green-800 transition-colors"
                              title="Save"
                            >
                              <Save size={18} />
                            </button>
                            <button 
                              onClick={cancelEditing}
                              className="p-1 text-red-600 hover:text-red-800 transition-colors"
                              title="Cancel"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <button 
                              onClick={() => startEditing(item)}
                              className="p-1 text-muted-foreground hover:text-apple-blue transition-colors"
                              title="Edit"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CustomCard>
        
        <AddItemModal
          isOpen={isAddItemModalOpen}
          onClose={() => setIsAddItemModalOpen(false)}
          onItemAdded={handleItemAdded}
        />
      </div>
    </MainLayout>
  );
};

export default Items;
