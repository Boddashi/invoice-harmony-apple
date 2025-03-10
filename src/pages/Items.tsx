
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Package } from 'lucide-react';

const Items = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Items</h1>
            <p className="text-muted-foreground">
              Manage your inventory and products
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center p-12 border rounded-lg">
          <div className="flex flex-col items-center text-center">
            <Package size={48} className="mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No items yet</h2>
            <p className="text-muted-foreground mb-4">
              You haven't added any items to your inventory yet.
            </p>
            <button className="bg-apple-blue text-white px-4 py-2 rounded-md hover:bg-apple-blue/90 transition-colors">
              Add Your First Item
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Items;
