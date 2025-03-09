
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import DashboardSummary from '../components/dashboard/DashboardSummary';
import InvoiceList from '../components/dashboard/InvoiceList';
import { BarChart4 } from 'lucide-react';
import CustomCard from '../components/ui/CustomCard';
import { useCurrency } from '@/contexts/CurrencyContext';

const Index = () => {
  const { currencySymbol } = useCurrency();
  
  // Format amount with currency symbol
  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };
  
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-7">
        <DashboardSummary />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Revenue Chart */}
          <CustomCard className="lg:col-span-2 min-h-[300px] animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Revenue</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm rounded-full bg-apple-blue/10 text-apple-blue">Monthly</button>
                <button className="px-3 py-1 text-sm rounded-full hover:bg-secondary">Quarterly</button>
                <button className="px-3 py-1 text-sm rounded-full hover:bg-secondary">Yearly</button>
              </div>
            </div>
            
            <div className="h-[240px] flex items-center justify-center text-muted-foreground">
              <div className="flex flex-col items-center">
                <BarChart4 size={48} strokeWidth={1.25} />
                <p className="mt-3">Revenue chart will appear here</p>
              </div>
            </div>
          </CustomCard>
          
          {/* Stats */}
          <CustomCard className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-lg font-semibold mb-4">Statistics</h2>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Paid</span>
                  <span className="text-sm font-medium">74%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-apple-green" style={{ width: '74%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="text-sm font-medium">19%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-apple-orange" style={{ width: '19%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Overdue</span>
                  <span className="text-sm font-medium">7%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-apple-red" style={{ width: '7%' }}></div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border mt-5">
                <h3 className="text-sm font-medium mb-3">Top Clients</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Apple Inc.</span>
                    <span className="font-medium">{formatAmount(5240)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Microsoft Corp.</span>
                    <span className="font-medium">{formatAmount(3180)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Google LLC</span>
                    <span className="font-medium">{formatAmount(2890)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CustomCard>
        </div>
        
        <InvoiceList />
      </div>
    </MainLayout>
  );
};

export default Index;
