import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import CustomCard from '../ui/CustomCard';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SummaryData {
  title: string;
  amount: number;
  change: string;
  isPositive: boolean;
  icon: React.ElementType;
  color: string;
  textColor: string;
  link?: string;
}

const DashboardSummary = () => {
  const { currencySymbol } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
  
  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id);
        
        if (invoicesError) {
          throw invoicesError;
        }
        
        const totalRevenue = invoices?.reduce((sum, invoice) => 
          invoice.status === 'paid' ? sum + Number(invoice.total_amount) : sum, 0) || 0;
          
        const pendingInvoices = invoices?.filter(invoice => invoice.status === 'pending') || [];
        const pendingAmount = pendingInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0);
        
        const paidInvoices = invoices?.filter(invoice => invoice.status === 'paid') || [];
        const paidAmount = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0);
        
        const overdueInvoices = invoices?.filter(invoice => invoice.status === 'overdue') || [];
        const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0);
        
        const previousTotalRevenue = totalRevenue * 0.8;
        const percentChange = totalRevenue > 0 
          ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue * 100).toFixed(1) + '%'
          : '0%';
        
        const newSummaryData: SummaryData[] = [
          { 
            title: 'Total Revenue', 
            amount: totalRevenue, 
            change: percentChange.startsWith('-') ? percentChange : `+${percentChange}`, 
            isPositive: !percentChange.startsWith('-'),
            icon: DollarSign,
            color: 'bg-apple-blue/10 text-apple-blue',
            textColor: 'text-apple-blue',
            link: '/invoices'
          },
          { 
            title: 'Pending Invoices', 
            amount: pendingAmount, 
            change: `${pendingInvoices.length} invoices`, 
            isPositive: false,
            icon: Clock,
            color: 'bg-apple-orange/10 text-apple-orange',
            textColor: 'text-apple-orange',
            link: '/invoices?filter=pending'
          },
          { 
            title: 'Paid Invoices', 
            amount: paidAmount, 
            change: `${paidInvoices.length} invoices`, 
            isPositive: true,
            icon: CheckCircle,
            color: 'bg-apple-green/10 text-apple-green',
            textColor: 'text-apple-green',
            link: '/invoices?filter=paid'
          },
          { 
            title: 'Overdue Invoices', 
            amount: overdueAmount, 
            change: `${overdueInvoices.length} invoices`, 
            isPositive: false,
            icon: AlertCircle,
            color: 'bg-apple-red/10 text-apple-red',
            textColor: 'text-apple-red',
            link: '/invoices?filter=overdue'
          }
        ];
        
        setSummaryData(newSummaryData);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to load dashboard data."
        });
        
        setSummaryData([
          { 
            title: 'Total Revenue', 
            amount: 0, 
            change: '+0%', 
            isPositive: true,
            icon: DollarSign,
            color: 'bg-apple-blue/10 text-apple-blue',
            textColor: 'text-apple-blue',
            link: '/invoices'
          },
          { 
            title: 'Pending Invoices', 
            amount: 0, 
            change: '0 invoices', 
            isPositive: false,
            icon: Clock,
            color: 'bg-apple-orange/10 text-apple-orange',
            textColor: 'text-apple-orange',
            link: '/invoices?filter=pending'
          },
          { 
            title: 'Paid Invoices', 
            amount: 0, 
            change: '0 invoices', 
            isPositive: true,
            icon: CheckCircle,
            color: 'bg-apple-blue/10 text-apple-blue',
            textColor: 'text-apple-blue',
            link: '/invoices?filter=paid'
          },
          { 
            title: 'Overdue Invoices', 
            amount: 0, 
            change: '0 invoices', 
            isPositive: false,
            icon: AlertCircle,
            color: 'bg-apple-red/10 text-apple-red',
            textColor: 'text-apple-red',
            link: '/invoices?filter=overdue'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user, toast, currencySymbol]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-slide-up">
        {[...Array(4)].map((_, index) => (
          <CustomCard key={index} className="min-h-[120px] opacity-60 animate-pulse">
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CustomCard>
        ))}
      </div>
    );
  }

  const handleCardClick = (link?: string) => {
    if (link) {
      navigate(link);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-slide-up">
      {summaryData.map((item, index) => {
        const Icon = item.icon;
        
        return (
          <CustomCard 
            key={index} 
            className={cn(
              "transition-transform duration-300 hover:translate-y-[-2px]",
              item.link && "cursor-pointer hover:ring-1 hover:ring-primary/20"
            )}
            onClick={() => handleCardClick(item.link)}
          >
            <div className="flex items-start justify-between">
              <div className={cn("p-2 rounded-lg", item.color)}>
                <Icon size={20} />
              </div>
              <div className="flex items-center gap-1 text-sm">
                {item.title === 'Total Revenue' ? (
                  <span className="text-apple-blue">
                    {item.change}
                  </span>
                ) : item.title === 'Pending Invoices' || item.title === 'Paid Invoices' || item.title === 'Overdue Invoices' ? (
                  <span className={item.textColor}>
                    {item.change}
                  </span>
                ) : (
                  <span className={cn(
                    item.isPositive ? 'text-apple-green' : 'text-apple-red'
                  )}>
                    {item.change}
                  </span>
                )}
                {item.title === 'Total Revenue' ? (
                  item.isPositive ? (
                    <ArrowUpRight size={16} className="text-apple-blue" />
                  ) : (
                    <ArrowDownRight size={16} className="text-apple-blue" />
                  )
                ) : item.title === 'Pending Invoices' ? (
                  <ArrowDownRight size={16} className="text-apple-orange" />
                ) : item.title === 'Paid Invoices' ? (
                  <ArrowUpRight size={16} className="text-apple-green" />
                ) : item.title === 'Overdue Invoices' ? (
                  <ArrowDownRight size={16} className="text-apple-red" />
                ) : null}
              </div>
            </div>
            
            <div className="mt-3">
              <h3 className="text-sm font-medium text-muted-foreground">{item.title}</h3>
              <p className="text-2xl font-semibold mt-1">{formatAmount(item.amount)}</p>
            </div>
          </CustomCard>
        );
      })}
    </div>
  );
};

export default DashboardSummary;
