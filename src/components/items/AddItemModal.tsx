
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (item: InvoiceItem) => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onItemAdded }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState('1'); // Default to 1

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to add an item');
      return;
    }

    if (!description || !unitPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const parsedUnitPrice = parseFloat(unitPrice);
      const parsedQuantity = parseFloat(quantity);
      const amount = parsedUnitPrice * parsedQuantity;
      
      // Get the first invoice to associate the item with
      // In a production app, you might want to let the user select an invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (invoiceError) throw invoiceError;
      
      if (!invoiceData || invoiceData.length === 0) {
        toast.error('You need to create an invoice first');
        return;
      }
      
      // Insert the new item into the invoice_items table
      const { data, error } = await supabase
        .from('invoice_items')
        .insert({
          invoice_id: invoiceData[0].id,
          description: description,
          unit_price: parsedUnitPrice,
          quantity: parsedQuantity,
          amount: amount,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Item added successfully');
      
      // Pass the new item back to the parent component
      onItemAdded(data);
      onClose();
      
      // Reset form
      setDescription('');
      setUnitPrice('');
      setQuantity('1');
      
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast.error(error.message || 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-card w-full max-w-md rounded-lg shadow-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Add New Item</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-muted-foreground">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full"
              placeholder="Item description"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="unitPrice" className="block text-sm font-medium text-muted-foreground">
              Unit Price <span className="text-red-500">*</span>
            </label>
            <input
              id="unitPrice"
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="input-field w-full"
              placeholder="0.00"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="quantity" className="block text-sm font-medium text-muted-foreground">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input-field w-full"
              placeholder="1"
              required
            />
          </div>
          
          <div className="pt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-md text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="apple-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
