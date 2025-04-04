
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import type { TimePeriod } from '@/components/reports/charts/RevenueChart';

// Types
export type Report = {
  id: string;
  title: string;
  data: any;
  type: 'monthly' | 'status' | 'client' | 'item';
  date: string;
  period?: TimePeriod;
};

export type InvoiceStats = {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  revenue: number;
};

export type Item = {
  id: string;
  title: string;
  price: number;
};

export type Client = {
  id: string;
  name: string;
};

const PIE_COLORS = ['#4ade80', '#f97316', '#f43f5e'];

export const useReportData = (reportSource: 'invoices' | 'credit-notes' = 'invoices') => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('monthly');
  const [invoiceStats, setInvoiceStats] = useState<InvoiceStats>({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    revenue: 0
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [clientData, setClientData] = useState<any[]>([]);
  const [itemData, setItemData] = useState<any[]>([]);
  const [savedReports, setSavedReports] = useState<Report[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchItemQuery, setSearchItemQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [searchClientQuery, setSearchClientQuery] = useState('');

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('id, title, price')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching items:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load items."
      });
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      setClients(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load clients."
      });
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId);
      } else {
        return [...prev, clientId];
      }
    });
  };

  const fetchInvoiceData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Determine which table to query based on reportSource
      const tableName = reportSource === 'invoices' ? 'invoices' : 'credit_notes';
      const itemsTable = reportSource === 'invoices' ? 'invoice_items' : 'credit_note_items';
      const numberField = reportSource === 'invoices' ? 'invoice_number' : 'credit_note_number';
      const dateField = reportSource === 'invoices' ? 'issue_date' : 'issue_date';
      
      let query = supabase
        .from(tableName)
        .select(`*, client:clients(name), ${itemsTable}(item_id, quantity, total_amount)`)
        .eq('user_id', user.id);

      const { data: allInvoices, error: invoicesError } = await query;
      
      if (invoicesError) throw invoicesError;

      let filteredInvoices = allInvoices || [];
      
      if (selectedItems.length > 0) {
        filteredInvoices = filteredInvoices.filter(invoice => {
          const invoiceItems = invoice[itemsTable] || [];
          return invoiceItems.some(item => selectedItems.includes(item.item_id));
        });
      }
      
      if (selectedClients.length > 0) {
        filteredInvoices = filteredInvoices.filter(invoice => 
          selectedClients.includes(invoice.client_id)
        );
      }

      const paidInvoices = filteredInvoices.filter(inv => inv.status === 'paid');
      const pendingInvoices = filteredInvoices.filter(inv => inv.status === 'pending');
      const overdueInvoices = reportSource === 'invoices' ? 
        filteredInvoices.filter(inv => inv.status === 'overdue') : [];
      
      const today = new Date();
      let periodStart: Date;
      let formatString: string;

      switch (selectedPeriod) {
        case 'daily':
          periodStart = subDays(today, 30);
          formatString = 'MMM dd';
          break;
        case 'weekly':
          periodStart = subWeeks(today, 12);
          formatString = "'Week' w, MMM";
          break;
        case 'monthly':
          periodStart = subMonths(today, 12);
          formatString = 'MMM yyyy';
          break;
        case 'yearly':
          periodStart = subYears(today, 5);
          formatString = 'yyyy';
          break;
      }

      const revenueByPeriod = new Map<string, number>();

      paidInvoices.forEach(invoice => {
        const date = new Date(invoice[dateField]);
        if (date >= periodStart) {
          const period = format(date, formatString);
          const currentAmount = revenueByPeriod.get(period) || 0;
          // For credit notes, we show the amount as negative
          const amount = reportSource === 'credit-notes' 
            ? -Math.abs(Number(invoice.total_amount))
            : Number(invoice.total_amount);
          revenueByPeriod.set(period, currentAmount + amount);
        }
      });

      const periodData = Array.from(revenueByPeriod.entries())
        .map(([period, amount]) => ({
          period,
          amount
        }))
        .sort((a, b) => {
          const dateA = new Date(a.period);
          const dateB = new Date(b.period);
          return dateA.getTime() - dateB.getTime();
        });

      setMonthlyData(periodData);
      
      const paidInvoicesList = filteredInvoices.filter(inv => inv.status === 'paid');
      
      // Calculate total revenue based on source
      let totalRevenue;
      if (reportSource === 'credit-notes') {
        // For credit notes, revenue is negative
        totalRevenue = -paidInvoicesList.reduce((sum, inv) => sum + Math.abs(Number(inv.total_amount)), 0);
      } else {
        // For invoices, revenue is positive
        totalRevenue = paidInvoicesList.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
      }
      
      setInvoiceStats({
        total: filteredInvoices.length,
        paid: paidInvoicesList.length,
        pending: pendingInvoices.length,
        overdue: overdueInvoices.length,
        revenue: totalRevenue
      });
      
      const totalCount = filteredInvoices.length || 1;
      
      const statusDataArray = [
        { 
          name: 'Paid', 
          value: paidInvoicesList.length, 
          fill: PIE_COLORS[0], 
          percent: paidInvoicesList.length / totalCount 
        },
        { 
          name: 'Pending', 
          value: pendingInvoices.length, 
          fill: PIE_COLORS[1], 
          percent: pendingInvoices.length / totalCount 
        }
      ];
      
      // Only add overdue for invoices, not for credit notes
      if (reportSource === 'invoices') {
        statusDataArray.push({ 
          name: 'Overdue', 
          value: overdueInvoices.length, 
          fill: PIE_COLORS[2], 
          percent: overdueInvoices.length / totalCount 
        });
      }
      
      setStatusData(statusDataArray);
      
      const clientRevenue: Record<string, number> = {};
      
      paidInvoicesList.forEach(invoice => {
        if (invoice.client && invoice.client.name) {
          const clientName = invoice.client.name;
          // For credit notes, amount is negative
          const amount = reportSource === 'credit-notes' 
            ? -Math.abs(Number(invoice.total_amount))
            : Number(invoice.total_amount);
          clientRevenue[clientName] = (clientRevenue[clientName] || 0) + amount;
        }
      });
      
      const clientDataArray = Object.entries(clientRevenue)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
        .slice(0, 5);
      
      setClientData(clientDataArray);
      
      const itemRevenue: Record<string, { amount: number, count: number }> = {};
      
      filteredInvoices.forEach(invoice => {
        if (invoice.status === 'paid' && invoice[itemsTable]) {
          invoice[itemsTable].forEach(item => {
            const itemDetails = items.find(i => i.id === item.item_id);
            
            if (itemDetails) {
              const itemName = itemDetails.title;
              
              if (!itemRevenue[itemName]) {
                itemRevenue[itemName] = { amount: 0, count: 0 };
              }
              
              // For credit notes, amount is negative
              const amount = reportSource === 'credit-notes' 
                ? -Math.abs(Number(item.total_amount))
                : Number(item.total_amount);
                
              itemRevenue[itemName].amount += amount;
              itemRevenue[itemName].count += Number(item.quantity);
            }
          });
        }
      });
      
      const itemDataArray = Object.entries(itemRevenue)
        .map(([name, data]) => ({ 
          name, 
          amount: data.amount,
          count: data.count 
        }))
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
      
      setItemData(itemDataArray);
      
      const titlePrefix = reportSource === 'invoices' ? 'Invoice ' : 'Credit Note ';
      const revenueTitle = reportSource === 'invoices' ? 'Revenue' : 'Amount';
      
      const reports: Report[] = [
        {
          id: '1',
          title: `${titlePrefix}${revenueTitle}`,
          data: periodData,
          type: 'monthly',
          date: format(new Date(), 'yyyy-MM-dd'),
          period: selectedPeriod
        },
        {
          id: '2',
          title: `${titlePrefix}Status`,
          data: statusDataArray,
          type: 'status',
          date: format(new Date(), 'yyyy-MM-dd')
        }
      ];
      
      if (clientDataArray.length > 0) {
        reports.push({
          id: '3',
          title: 'Top Clients',
          data: clientDataArray,
          type: 'client',
          date: format(new Date(), 'yyyy-MM-dd')
        });
      }
      
      if (itemDataArray.length > 0 && selectedItems.length > 0) {
        reports.push({
          id: '4',
          title: 'Selected Items Analysis',
          data: itemDataArray,
          type: 'item',
          date: format(new Date(), 'yyyy-MM-dd')
        });
      }
      
      setSavedReports(reports);
      
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load report data."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedItems([]);
    setSelectedClients([]);
    setSearchItemQuery('');
    setSearchClientQuery('');
  };

  useEffect(() => {
    if (user) {
      fetchItems();
      fetchClients();
      fetchInvoiceData();
    }
  }, [user, selectedPeriod, reportSource]);

  useEffect(() => {
    if (user) {
      fetchInvoiceData();
    }
  }, [selectedItems, selectedClients]);

  return {
    isLoading,
    invoiceStats,
    monthlyData,
    statusData,
    clientData,
    itemData,
    savedReports,
    items,
    clients,
    selectedItems,
    selectedClients,
    searchItemQuery,
    searchClientQuery,
    selectedPeriod,
    setSelectedPeriod,
    toggleItemSelection,
    toggleClientSelection,
    setSearchItemQuery,
    setSearchClientQuery,
    clearFilters
  };
};
