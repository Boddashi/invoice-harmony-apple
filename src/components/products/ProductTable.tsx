
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type Product = {
  id: string;
  description: string;
  unit_price: number;
  created_at: string;
};

const ProductTable = () => {
  const { user } = useAuth();
  
  // Fetch product data from invoice_items
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      // Get unique invoice items to serve as products
      const { data, error } = await supabase
        .from('invoice_items')
        .select('id, description, unit_price, created_at')
        .order('description', { ascending: true });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Get unique products by description
      const uniqueProducts = data.filter((item, index, self) => 
        index === self.findIndex((t) => t.description === item.description)
      );
      
      return uniqueProducts as Product[];
    },
    enabled: !!user,
  });

  // Show error toast if query fails
  if (error) {
    toast.error('Failed to load products');
    console.error('Products query error:', error);
  }

  return (
    <Card className="p-6">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="hidden md:table-cell">Added Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array(5).fill(0).map((_, i) => (
                <TableRow key={`loading-${i}`}>
                  <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-32" /></TableCell>
                </TableRow>
              ))
            ) : products && products.length > 0 ? (
              // Product data
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.description}</TableCell>
                  <TableCell className="text-right">${product.unit_price.toFixed(2)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(product.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              // No products found
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  No products found. Add your first product to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default ProductTable;
