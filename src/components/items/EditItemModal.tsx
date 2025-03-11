
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Loader2, Euro } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Item {
  id: string;
  title: string;
  price: number;
  vat: string;
}

interface EditItemModalProps {
  item: Item;
  onItemUpdated: () => void;
  trigger?: React.ReactNode;
}

interface VatRate {
  title: string;
  amount: number | null;
}

const EditItemModal = ({ item, onItemUpdated, trigger }: EditItemModalProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [price, setPrice] = useState(item.price.toString());
  const [vat, setVat] = useState(item.vat);
  const [loading, setLoading] = useState(false);
  const [vatRates, setVatRates] = useState<VatRate[]>([]);
  const [fetchingVatRates, setFetchingVatRates] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { user } = useAuth();
  const { currencySymbol } = useCurrency();
  
  useEffect(() => {
    if (open) {
      fetchVatRates();
    }
  }, [open]);

  useEffect(() => {
    setTitle(item.title);
    setPrice(item.price.toString());
    setVat(item.vat);
  }, [item]);
  
  const fetchVatRates = async () => {
    try {
      setFetchingVatRates(true);
      setFetchError(null);
      
      const { data, error } = await supabase
        .from('vats')
        .select('title, amount');
      
      if (error) {
        console.error('Error fetching VAT rates:', error);
        setFetchError(`Query error: ${error.message}`);
        throw error;
      }
      
      if (data && data.length > 0) {
        setVatRates(data);
      } else {
        setFetchError('No VAT rates found in the database');
        
        const defaultVats: VatRate[] = [
          { title: '0%', amount: 0 },
          { title: '6%', amount: 6 },
          { title: '12%', amount: 12 },
          { title: '21%', amount: 21 }
        ];
        setVatRates(defaultVats);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Exception during VAT rates fetch:', errorMessage);
      toast.error('Failed to fetch VAT rates');
      setFetchError(`Exception: ${errorMessage}`);
      
      const defaultVats: VatRate[] = [
        { title: '0%', amount: 0 },
        { title: '6%', amount: 6 },
        { title: '12%', amount: 12 },
        { title: '21%', amount: 21 }
      ];
      setVatRates(defaultVats);
    } finally {
      setFetchingVatRates(false);
    }
  };
  
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !price || !vat) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!user) {
      toast.error('You must be logged in to update items');
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('items')
        .update({
          title,
          price: parseFloat(price),
          vat
        })
        .eq('id', item.id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      toast.success('Item updated successfully');
      setOpen(false);
      onItemUpdated();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleUpdateItem} className="space-y-4 mt-4">
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
            <Label htmlFor="price" className="flex items-center gap-1">
              Price <Euro className="h-4 w-4" />
            </Label>
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
            {fetchingVatRates ? (
              <div className="flex items-center space-x-2 h-10 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading VAT rates...</span>
              </div>
            ) : fetchError ? (
              <div className="text-sm text-destructive py-2">
                Error: {fetchError}
              </div>
            ) : vatRates.length > 0 ? (
              <Select value={vat} onValueChange={setVat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select VAT rate" />
                </SelectTrigger>
                <SelectContent>
                  {vatRates.map((rate) => (
                    <SelectItem key={rate.title} value={rate.title}>
                      {rate.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-muted-foreground py-2">
                No VAT rates available. Please create some in the system.
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-apple-blue hover:bg-apple-blue/90"
              disabled={loading || fetchingVatRates || vatRates.length === 0}
            >
              {loading ? 'Updating...' : 'Update Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemModal;
