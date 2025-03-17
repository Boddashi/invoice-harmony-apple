import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Euro } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';

interface AddItemModalProps {
  onItemAdded: () => void;
  trigger?: React.ReactNode;
  className?: string;
}

interface VatRate {
  title: string;
  amount: number | null;
}

const AddItemModal = ({ onItemAdded, trigger, className }: AddItemModalProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [vat, setVat] = useState('');
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
  
  const fetchVatRates = async () => {
    try {
      setFetchingVatRates(true);
      setFetchError(null);
      
      console.log('Attempting to fetch VAT rates from the vats table');
      
      const { data, error, status } = await supabase
        .from('vats')
        .select('title, amount');
      
      console.log('Supabase response status:', status);
      console.log('Supabase query result:', { data, error });
      
      if (error) {
        console.error('Error fetching VAT rates:', error);
        setFetchError(`Query error: ${error.message}`);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log('VAT rates fetched successfully:', data);
        setVatRates(data);
        setVat(data[0].title); // Set default vat to first option
      } else {
        console.warn('No VAT rates found in the database. Response was:', data);
        setFetchError('No VAT rates found in the database');
        
        const defaultVats: VatRate[] = [
          { title: '0%', amount: 0 },
          { title: '6%', amount: 6 },
          { title: '12%', amount: 12 },
          { title: '21%', amount: 21 }
        ];
        setVatRates(defaultVats);
        setVat(defaultVats[0].title);
        console.log('Using fallback VAT rates:', defaultVats);
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
      setVat(defaultVats[0].title);
    } finally {
      setFetchingVatRates(false);
    }
  };
  
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !price || !vat) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!user) {
      toast.error('You must be logged in to add items');
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('items')
        .insert({
          title,
          price: parseFloat(price),
          vat,
          user_id: user.id
        });
        
      if (error) throw error;
      
      toast.success('Item added successfully');
      setOpen(false);
      setTitle('');
      setPrice('');
      setVat(vatRates.length > 0 ? vatRates[0].title : '');
      
      if (onItemAdded) {
        onItemAdded();
      }
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    } finally {
      setLoading(false);
    }
  };
  
  const formatVatRateLabel = (rate: VatRate) => {
    return rate.title;
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="apple" className={className}>
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
                <SelectTrigger className="w-full">
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
              variant="apple"
              disabled={loading || fetchingVatRates || vatRates.length === 0}
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
