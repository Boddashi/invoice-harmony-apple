
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CustomCard from '@/components/ui/CustomCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Plus, Save, X, Pencil, Trash2 } from 'lucide-react';
import AddItemModal from '@/components/items/AddItemModal';
import { toast } from 'sonner';

interface Item {
  id: string;
  title: string;
  price: number;
  vat: string;
}

const Items = () => {
  const { user } = useAuth();
  const { currencySymbol } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  
  // State for editing
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Item>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchItems = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch items from items table
      const { data, error } = await supabase
        .from('items')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      setItems(data || []);
      
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchItems();
  }, [user]);
  
  const handleItemAdded = (newItem: Item) => {
    setItems([...items, newItem]);
  };

  // Start editing an item
  const startEditing = (item: Item) => {
    setEditingItemId(item.id);
    setEditValues({
      title: item.title,
      price: item.price,
      vat: item.vat
    });
  };

  // Handle input change during editing
  const handleEditChange = (field: keyof Item, value: string | number) => {
    setEditValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save the edited item
  const saveItem = async () => {
    if (!editingItemId || !editValues) return;
    
    try {
      setIsSaving(true);
      
      // Update the item in the database
      const { error } = await supabase
        .from('items')
        .update({
          title: editValues.title,
          price: Number(editValues.price),
          vat: editValues.vat
        })
        .eq('id', editingItemId);
      
      if (error) throw error;
      
      // Update local state
      setItems(items.map(item => 
        item.id === editingItemId 
          ? { 
              ...item, 
              title: editValues.title || item.title,
              price: Number(editValues.price) || item.price,
              vat: editValues.vat || item.vat
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

  // Delete an item
  const deleteItem = async (id: string) => {
    if (!id) return;
    
    try {
      setIsDeleting(true);
      
      // Delete the item from the database
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setItems(items.filter(item => item.id !== id));
      
      toast.success('Item deleted successfully');
      
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error(error.message || 'Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
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
              <p className="mt-2">Click "Add Item" to create your first item.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="py-3 px-4 font-medium">Title</th>
                    <th className="py-3 px-4 font-medium text-right">Price</th>
                    <th className="py-3 px-4 font-medium text-right">VAT (%)</th>
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
                            value={editValues.title}
                            onChange={(e) => handleEditChange('title', e.target.value)}
                            className="input-field w-full"
                          />
                        ) : (
                          <div onClick={() => startEditing(item)} className="cursor-pointer hover:text-apple-blue">
                            {item.title}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingItemId === item.id ? (
                          <input 
                            type="number"
                            min="0"
                            step="0.01"
                            value={editValues.price}
                            onChange={(e) => handleEditChange('price', e.target.value)}
                            className="input-field w-full text-right"
                          />
                        ) : (
                          <div onClick={() => startEditing(item)} className="cursor-pointer hover:text-apple-blue">
                            {currencySymbol}{item.price.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingItemId === item.id ? (
                          <input 
                            type="text"
                            value={editValues.vat}
                            onChange={(e) => handleEditChange('vat', e.target.value)}
                            className="input-field w-full text-right"
                          />
                        ) : (
                          <div onClick={() => startEditing(item)} className="cursor-pointer hover:text-apple-blue">
                            {item.vat}%
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
                          <div className="flex justify-center gap-3">
                            <button 
                              onClick={() => startEditing(item)}
                              className="p-1 text-muted-foreground hover:text-apple-blue transition-colors"
                              title="Edit item"
                            >
                              <Pencil size={18} />
                            </button>
                            <button 
                              onClick={() => deleteItem(item.id)}
                              disabled={isDeleting}
                              className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                              title="Delete item"
                            >
                              <Trash2 size={18} />
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
