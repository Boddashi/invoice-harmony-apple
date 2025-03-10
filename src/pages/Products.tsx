
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Package } from 'lucide-react';

const Products = () => {
  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package size={24} className="text-apple-blue" />
            <h1 className="text-2xl font-semibold">Products</h1>
          </div>
        </div>
        
        <div className="grid gap-6">
          <div className="bg-white rounded-xl p-6 shadow-apple-sm border border-border/40">
            <h2 className="text-lg font-medium mb-4">Manage Your Products</h2>
            <p className="text-muted-foreground">
              Your product catalog will appear here. Add products to quickly select them when creating invoices.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Products;
