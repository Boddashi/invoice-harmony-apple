
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MainLayout from '@/components/layout/MainLayout';
import CustomCard from '@/components/ui/CustomCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Plus } from 'lucide-react';
import AddItemModal from '@/components/items/AddItemModal';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

const Items = () => {
  const { user } = useAuth();
  const { currencySymbol } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  const fetchItems = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch items from invoice_items
      const { data, error } = await supabase
        .from('invoice_items')
        .select(`
          id,
          description,
          quantity,
          unit_price,
          amount,
          invoice_id,
          invoices(user_id)
        `)
        .eq('invoices.user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Process the data
      const filteredItems = (data || []).filter(item => item.invoices !== null);
      setItems(filteredItems);
      
      // Process data for chart
      const itemMap = new Map();
      filteredItems.forEach(item => {
        if (itemMap.has(item.description)) {
          const existing = itemMap.get(item.description);
          itemMap.set(item.description, {
            description: item.description,
            amount: existing.amount + item.amount,
            quantity: existing.quantity + item.quantity
          });
        } else {
          itemMap.set(item.description, {
            description: item.description,
            amount: item.amount,
            quantity: item.quantity
          });
        }
      });
      
      setChartData(Array.from(itemMap.values()));
      
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchItems();
  }, [user]);
  
  const handleItemAdded = () => {
    fetchItems();
  };

  return (
    <MainLayout>
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
        
        <Tabs defaultValue="table" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="table">Items Table</TabsTrigger>
            <TabsTrigger value="chart">Usage Chart</TabsTrigger>
          </TabsList>
          
          <TabsContent value="table" className="mt-4">
            <CustomCard>
              {loading ? (
                <div className="py-12 text-center">Loading items...</div>
              ) : items.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No items found.</p>
                  <p className="mt-2">Create an invoice with items to see them here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="text-left border-b border-border">
                        <th className="py-3 px-4 font-medium">Description</th>
                        <th className="py-3 px-4 font-medium text-right">Unit Price</th>
                        <th className="py-3 px-4 font-medium text-right">Quantity</th>
                        <th className="py-3 px-4 font-medium text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="py-3 px-4">{item.description}</td>
                          <td className="py-3 px-4 text-right">{currencySymbol}{item.unit_price.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">{item.quantity}</td>
                          <td className="py-3 px-4 text-right font-medium">{currencySymbol}{item.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CustomCard>
          </TabsContent>
          
          <TabsContent value="chart" className="mt-4">
            <CustomCard>
              {loading ? (
                <div className="py-12 text-center">Loading chart data...</div>
              ) : chartData.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No data available for chart.</p>
                  <p className="mt-2">Create an invoice with items to see usage data.</p>
                </div>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 70,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="description" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                      />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip formatter={(value: number) => `${currencySymbol}${value.toFixed(2)}`} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="amount" name="Total Amount" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="quantity" name="Quantity" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CustomCard>
          </TabsContent>
        </Tabs>
        
        <AddItemModal
          isOpen={isAddItemModalOpen}
          onClose={() => setIsAddItemModalOpen(false)}
          onItemAdded={handleItemAdded}
        />
      </div>
    </MainLayout>
  );
};

export default Items;
