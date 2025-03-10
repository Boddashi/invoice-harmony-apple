
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import CustomCard from '@/components/ui/CustomCard';
import ItemTable from './ItemTable';
import AddItemModal from './AddItemModal';

interface Item {
  id: string;
  title: string;
  price: number;
  vat: string;
}

const ItemsContainer: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  
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

  const handleItemsChange = (updatedItems: Item[]) => {
    setItems(updatedItems);
  };

  return (
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
        <ItemTable 
          items={items} 
          loading={loading} 
          onItemsChange={handleItemsChange} 
        />
      </CustomCard>
      
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onItemAdded={handleItemAdded}
      />
    </div>
  );
};

export default ItemsContainer;
