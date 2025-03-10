
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddItemModalProps {
  onItemAdded: () => void;
  trigger?: React.ReactNode;
}

const AddItemModal = ({ onItemAdded, trigger }: AddItemModalProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [vat, setVat] = useState('21%'); // Default VAT rate
  const [loading, setLoading] = useState(false);
  
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !price) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('items')
        .insert({
          title,
          price: parseFloat(price),
          vat
        });
        
      if (error) throw error;
      
      toast.success('Item added successfully');
      setOpen(false);
      setTitle('');
      setPrice('');
      setVat('21%');
      onItemAdded();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-apple-blue hover:bg-apple-blue/90">
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleAddItem} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Item Name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter item name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="vat">VAT Rate</Label>
            <Select value={vat} onValueChange={setVat}>
              <SelectTrigger>
                <SelectValue placeholder="Select VAT rate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0%">0%</SelectItem>
                <SelectItem value="6%">6%</SelectItem>
                <SelectItem value="12%">12%</SelectItem>
                <SelectItem value="21%">21%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-apple-blue hover:bg-apple-blue/90"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemModal;
