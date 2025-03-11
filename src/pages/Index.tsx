
import React, { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import DashboardSummary from '../components/dashboard/DashboardSummary';
import InvoiceList from '../components/dashboard/InvoiceList';
import { BarChart4 } from 'lucide-react';
import CustomCard from '../components/ui/CustomCard';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClientRevenue {
  name: string;
  amount: number;
}

interface Stats {
  paid: number;
  pending: number;
  overdue: number;
  topClients: ClientRevenue[];
}

const Index = () => {
  const { currencySymbol } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    paid: 74,
    pending: 19,
    overdue: 7,
    topClients: []
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Format amount with currency symbol
  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };
  
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch all invoices
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select(`
            *,
            client:clients(name)
          `)
          .eq('user_id', user.id);
        
        if (invoicesError) {
          throw invoicesError;
        }
        
        // Calculate statistics
        const totalAmount = invoices?.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0) || 0;
        
        const paidAmount = invoices?.filter(i => i.status === 'paid')
          .reduce((sum, invoice) => sum + Number(invoice.total_amount), 0) || 0;
          
        const pendingAmount = invoices?.filter(i => i.status === 'pending')
          .reduce((sum, invoice) => sum + Number(invoice.total_amount), 0) || 0;
          
        const overdueAmount = invoices?.filter(i => i.status === 'overdue')
          .reduce((sum, invoice) => sum + Number(invoice.total_amount), 0) || 0;
        
        // Calculate percentages
        const paidPercent = totalAmount > 0 ? Math.round(paidAmount / totalAmount * 100) : 0;
        const pendingPercent = totalAmount > 0 ? Math.round(pendingAmount / totalAmount * 100) : 0;
        const overduePercent = totalAmount > 0 ? Math.round(overdueAmount / totalAmount * 100) : 0;
        
        // Calculate top clients
        const clientMap = new Map<string, { name: string, amount: number }>();
        
        invoices?.forEach(invoice => {
          const clientName = invoice.client?.name || 'Unknown Client';
          const clientId = invoice.client_id;
          
          if (clientMap.has(clientId)) {
            const current = clientMap.get(clientId)!;
            clientMap.set(clientId, {
              name: clientName,
              amount: current.amount + Number(invoice.total_amount)
            });
          } else {
            clientMap.set(clientId, {
              name: clientName,
              amount: Number(invoice.total_amount)
            });
          }
        });
        
        const topClients = Array.from(clientMap.values())
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 3);
        
        setStats({
          paid: paidPercent,
          pending: pendingPercent,
          overdue: overduePercent,
          topClients
        });
      } catch (error: any) {
        console.error('Error fetching statistics:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to load statistics."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [user, toast, currencySymbol]);
  
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
            
            {isLoading ? (
              <div className="space-y-5 animate-pulse opacity-60">
                <div>
                  <div className="h-6 bg-secondary rounded-md mb-2"></div>
                  <div className="h-2 bg-secondary rounded-full"></div>
                </div>
                <div>
                  <div className="h-6 bg-secondary rounded-md mb-2"></div>
                  <div className="h-2 bg-secondary rounded-full"></div>
                </div>
                <div>
                  <div className="h-6 bg-secondary rounded-md mb-2"></div>
                  <div className="h-2 bg-secondary rounded-full"></div>
                </div>
                <div className="pt-4 border-t border-border mt-5">
                  <div className="h-6 bg-secondary rounded-md mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-5 bg-secondary rounded-md"></div>
                    <div className="h-5 bg-secondary rounded-md"></div>
                    <div className="h-5 bg-secondary rounded-md"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Paid</span>
                    <span className="text-sm font-medium">{stats.paid}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-apple-green" style={{ width: `${stats.paid}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <span className="text-sm font-medium">{stats.pending}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-apple-orange" style={{ width: `${stats.pending}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Overdue</span>
                    <span className="text-sm font-medium">{stats.overdue}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-apple-red" style={{ width: `${stats.overdue}%` }}></div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border mt-5">
                  <h3 className="text-sm font-medium mb-3">Top Clients</h3>
                  
                  {stats.topClients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No client data available</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.topClients.map((client, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span>{client.name}</span>
                          <span className="font-medium">{formatAmount(client.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CustomCard>
        </div>
        
        <InvoiceList />
      </div>
    </MainLayout>
  );
};

export default Index;
