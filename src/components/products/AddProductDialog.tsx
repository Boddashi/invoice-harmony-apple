
import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const productSchema = z.object({
  description: z.string().min(1, 'Product description is required'),
  unit_price: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: 'Price must be a positive number' }
  ),
});

type ProductFormValues = z.infer<typeof productSchema>;

const AddProductDialog = ({ open, onOpenChange }: AddProductDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      description: '',
      unit_price: '',
    },
  });

  // Mutation to add a new product (invoice item)
  const addProductMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      // Create a dummy invoice for the product
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          client_id: '00000000-0000-0000-0000-000000000000', // Placeholder
          user_id: user?.id,
          due_date: new Date().toISOString(),
          invoice_number: `PROD-${Date.now()}`,
          status: 'draft',
          total_amount: 0,
          amount: 0,
        })
        .select()
        .single();

      if (invoiceError) throw new Error(invoiceError.message);

      // Add product as invoice item
      const { data, error } = await supabase
        .from('invoice_items')
        .insert({
          invoice_id: invoiceData.id,
          description: values.description,
          unit_price: Number(values.unit_price),
          quantity: 1,
          amount: Number(values.unit_price),
        });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
      
      // Show success message
      toast.success('Product added successfully');
      
      // Refresh product data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-chart'] });
    },
    onError: (error) => {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    },
  });

  const onSubmit = (values: ProductFormValues) => {
    if (user) {
      addProductMutation.mutate(values);
    } else {
      toast.error('You must be logged in to add products');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new product to your catalog for use in invoices.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Product description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="unit_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Price ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="submit"
                disabled={addProductMutation.isPending}
              >
                {addProductMutation.isPending ? 'Adding...' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
