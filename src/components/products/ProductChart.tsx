
import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const ProductChart = () => {
  const { user } = useAuth();
  
  // Fetch product data from invoice_items for the chart
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['product-chart'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('description, unit_price');
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Get unique products and count how many times they appear
      const productMap = new Map();
      data.forEach(item => {
        const key = item.description;
        if (productMap.has(key)) {
          productMap.set(key, {
            count: productMap.get(key).count + 1,
            price: item.unit_price,
          });
        } else {
          productMap.set(key, { count: 1, price: item.unit_price });
        }
      });
      
      // Convert to array for chart
      const chartData = Array.from(productMap.entries()).map(([name, info]) => ({
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        count: info.count,
        price: info.price,
      }));
      
      // Sort by usage count
      return chartData.sort((a, b) => b.count - a.count).slice(0, 10);
    },
    enabled: !!user,
  });

  // Show error toast if query fails
  if (error) {
    toast.error('Failed to load chart data');
    console.error('Products chart query error:', error);
  }

  // Generate a different color for each bar
  const getBarColor = (index: number) => {
    const colors = [
      '#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6',
      '#1abc9c', '#f39c12', '#d35400', '#c0392b', '#8e44ad'
    ];
    return colors[index % colors.length];
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Product Usage</h3>
      
      {isLoading ? (
        <div className="w-full h-[400px] flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </div>
      ) : products && products.length > 0 ? (
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={products}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={60} 
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [`${value} ${name === 'price' ? 'USD' : 'uses'}`, name]}
                labelFormatter={(label) => `Product: ${label}`}
              />
              <Bar dataKey="count" name="Usage Count">
                {products.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No product data available. Add products to see usage statistics.
        </div>
      )}
    </Card>
  );
};

export default ProductChart;
