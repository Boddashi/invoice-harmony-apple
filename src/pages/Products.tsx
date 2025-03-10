
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Package, Plus, List, ChartBar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductTable from '@/components/products/ProductTable';
import ProductChart from '@/components/products/ProductChart';
import AddProductDialog from '@/components/products/AddProductDialog';

const Products = () => {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package size={24} className="text-apple-blue" />
            <h1 className="text-2xl font-semibold">Products</h1>
          </div>
          <Button onClick={() => setIsAddProductOpen(true)} className="flex items-center gap-2">
            <Plus size={18} />
            <span>Add Product</span>
          </Button>
        </div>
        
        <Tabs defaultValue="table" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="table" className="flex items-center gap-2">
              <List size={16} />
              <span>List View</span>
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex items-center gap-2">
              <ChartBar size={16} />
              <span>Chart View</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="table">
            <ProductTable />
          </TabsContent>
          <TabsContent value="chart">
            <ProductChart />
          </TabsContent>
        </Tabs>
      </div>
      
      <AddProductDialog 
        open={isAddProductOpen} 
        onOpenChange={setIsAddProductOpen} 
      />
    </MainLayout>
  );
};

export default Products;
