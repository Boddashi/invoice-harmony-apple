
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Package, BarChart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface ChartData {
  name: string;
  value: number;
  count: number;
}

const Items = () => {
  const [activeTab, setActiveTab] = useState<string>('items');
  const [loading, setLoading] = useState<boolean>(true);
  const [productUsage, setProductUsage] = useState<ChartData[]>([]);
  const [productItems, setProductItems] = useState<InvoiceItem[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchItemsData();
  }, []);

  const fetchItemsData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Query invoice_items table to get items usage
      const { data, error } = await supabase
        .from('invoice_items')
        .select('id, description, quantity, unit_price, amount')
        .order('description');
      
      if (error) {
        throw error;
      }
      
      // Store the raw items for the table
      setProductItems(data);
      
      // Process data for the chart
      const productStats: Record<string, { value: number, count: number }> = {};
      
      data.forEach((item: InvoiceItem) => {
        const productName = item.description;
        
        if (!productStats[productName]) {
          productStats[productName] = { value: 0, count: 0 };
        }
        
        productStats[productName].value += Number(item.amount);
        productStats[productName].count += Number(item.quantity);
      });
      
      // Convert to chart data format
      const chartData = Object.keys(productStats).map(name => ({
        name,
        value: Number(productStats[name].value.toFixed(2)),
        count: productStats[name].count
      }));
      
      setProductUsage(chartData);
    } catch (error: any) {
      toast.error('Error loading items data: ' + error.message);
      console.error('Error fetching items data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package size={24} className="text-apple-blue" />
            <h1 className="text-2xl font-semibold">Items</h1>
          </div>
        </div>
        
        <Tabs defaultValue="items" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="chart">Usage Chart</TabsTrigger>
          </TabsList>
          
          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle>Item Inventory</CardTitle>
                <CardDescription>
                  View and manage your items
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="w-full h-[400px] flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                  </div>
                ) : productItems.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Total Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.description}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No items available</h3>
                    <p className="text-muted-foreground mt-2">
                      Items will appear here once you've created invoices with items.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="chart">
            <Card>
              <CardHeader>
                <CardTitle>Item Usage</CardTitle>
                <CardDescription>
                  Visualize how your items are being used across invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="w-full h-[400px] flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                  </div>
                ) : productUsage.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <RechartsBarChart data={productUsage} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}`, 'Total Amount']} />
                      <Legend />
                      <Bar dataKey="value" name="Total Amount" fill="#0066CC" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="count" name="Quantity" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <BarChart className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No item data available</h3>
                    <p className="text-muted-foreground mt-2">
                      Item usage data will appear here once you've created invoices with items.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Items;
