
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Package, BarChart, Plus } from 'lucide-react';
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

const Products = () => {
  const [activeTab, setActiveTab] = useState<string>('products');
  const [loading, setLoading] = useState<boolean>(true);
  const [productUsage, setProductUsage] = useState<ChartData[]>([]);
  const [productItems, setProductItems] = useState<InvoiceItem[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchProductData();
  }, []);

  const fetchProductData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Query invoice_items table to get product usage
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
      toast.error('Error loading product data: ' + error.message);
      console.error('Error fetching product data:', error);
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
            <h1 className="text-2xl font-semibold">Products</h1>
          </div>
        </div>
        
        <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="chart">Usage Chart</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Product Inventory</CardTitle>
                <CardDescription>
                  View and manage your products
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
                        {productItems.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.description}</TableCell>
                            <TableCell className="text-right">{formatCurrency(product.unit_price)}</TableCell>
                            <TableCell className="text-right">{product.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(product.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No products available</h3>
                    <p className="text-muted-foreground mt-2">
                      Products will appear here once you've created invoices with products.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="chart">
            <Card>
              <CardHeader>
                <CardTitle>Product Usage</CardTitle>
                <CardDescription>
                  Visualize how your products are being used across invoices
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
                    <h3 className="text-lg font-medium">No product data available</h3>
                    <p className="text-muted-foreground mt-2">
                      Product usage data will appear here once you've created invoices with products.
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

export default Products;
