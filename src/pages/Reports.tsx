
import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import CustomCard from '@/components/ui/CustomCard';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, Download, PieChart as PieChartIcon, 
  CheckCircle2, Clock, AlertCircle, FilterIcon, Users 
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LegendProps
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

type Report = {
  id: string;
  title: string;
  data: any;
  type: 'monthly' | 'status' | 'client' | 'item';
  date: string;
};

type InvoiceStats = {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  revenue: number;
};

type Item = {
  id: string;
  title: string;
  price: number;
};

type Client = {
  id: string;
  name: string;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 2.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  const displayText = `${name}: ${value}`;
  
  const pieColor = PIE_COLORS[index % PIE_COLORS.length];

  return (
    <g>
      <path 
        d={`M${cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN)},${cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN)}L${x},${y}`} 
        stroke={pieColor}
        strokeWidth={1.8} 
        fill="none" 
        strokeDasharray="3,3"
      />
      <circle cx={x} cy={y} r={4} fill={pieColor} />
      <text 
        x={x + (x > cx ? 14 : -14)} 
        y={y} 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fill="#333"
        fontWeight="700"
        fontSize="15"
        letterSpacing="0.3px"
      >
        {displayText}
      </text>
      <text 
        x={x + (x > cx ? 14 : -14)} 
        y={y + 20} 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fill={pieColor}
        fontWeight="600"
        fontSize="13"
      >
        {`(${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};

const PIE_COLORS = ['#4ade80', '#f97316', '#f43f5e'];

const STATUS_ICONS = {
  'Paid': <CheckCircle2 size={16} className="text-[#4ade80]" />,
  'Pending': <Clock size={16} className="text-[#f97316]" />,
  'Overdue': <AlertCircle size={16} className="text-[#f43f5e]" />
};

interface EnhancedLegendProps {
  payload?: any[];
}

const EnhancedLegend = ({ payload = [] }: EnhancedLegendProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      {payload.map((entry, index) => (
        <div 
          key={`legend-${index}`} 
          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50"
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <div className="flex items-center gap-1.5">
              {STATUS_ICONS[entry.value]}
              <span className="font-medium">{entry.value}</span>
            </div>
          </div>
          <span className="text-muted-foreground ml-auto">
            {entry.payload.count} ({(entry.payload.percent * 100).toFixed(0)}%)
          </span>
        </div>
      ))}
    </div>
  );
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border shadow-lg rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.fill }}></div>
          <p className="font-semibold">{data.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Count: {data.value}</p>
          <p className="text-sm text-muted-foreground">Share: {(data.percent * 100).toFixed(1)}%</p>
        </div>
      </div>
    );
  }
  return null;
};

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    if (user) {
      fetchItems();
      fetchClients();
      fetchInvoiceData();
    }
  }, [user]);

  useEffect(() => {
    if (user && (selectedItems.length > 0 || selectedClients.length > 0)) {
      fetchInvoiceData();
    }
  }, [selectedItems, selectedClients]);

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

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchItemQuery.toLowerCase())
  );

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchClientQuery.toLowerCase())
  );

  const fetchInvoiceData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      let invoiceQuery = supabase
        .from('invoices')
        .select('*, client:clients(name), invoice_items!inner(item_id, quantity, total_amount)')
        .eq('user_id', user.id);
      
      if (selectedItems.length > 0) {
        invoiceQuery = invoiceQuery.filter('invoice_items.item_id', 'in', `(${selectedItems.join(',')})`);
      }
      
      if (selectedClients.length > 0) {
        invoiceQuery = invoiceQuery.filter('client_id', 'in', `(${selectedClients.join(',')})`);
      }
      
      const { data: invoices, error: invoicesError } = await invoiceQuery;
      
      if (invoicesError) throw invoicesError;
      
      if (!invoices || invoices.length === 0) {
        setIsLoading(false);
        return;
      }
      
      const paidInvoices = invoices.filter(inv => inv.status === 'paid');
      const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
      const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
      
      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
      
      setInvoiceStats({
        total: invoices.length,
        paid: paidInvoices.length,
        pending: pendingInvoices.length,
        overdue: overdueInvoices.length,
        revenue: totalRevenue
      });
      
      const monthlyRevenue: Record<string, number> = {};
      
      paidInvoices.forEach(invoice => {
        const month = format(new Date(invoice.issue_date), 'MMM yyyy');
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(invoice.total_amount);
      });
      
      const monthlyDataArray = Object.entries(monthlyRevenue).map(([month, amount]) => ({
        month,
        amount
      })).sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
      
      setMonthlyData(monthlyDataArray);
      
      const statusDataArray = [
        { name: 'Paid', value: paidInvoices.length, fill: PIE_COLORS[0], percent: paidInvoices.length / invoices.length },
        { name: 'Pending', value: pendingInvoices.length, fill: PIE_COLORS[1], percent: pendingInvoices.length / invoices.length },
        { name: 'Overdue', value: overdueInvoices.length, fill: PIE_COLORS[2], percent: overdueInvoices.length / invoices.length }
      ];
      
      setStatusData(statusDataArray);
      
      const clientRevenue: Record<string, number> = {};
      
      invoices.forEach(invoice => {
        const clientName = invoice.client?.name || 'Unknown';
        if (invoice.status === 'paid') {
          clientRevenue[clientName] = (clientRevenue[clientName] || 0) + Number(invoice.total_amount);
        }
      });
      
      const clientDataArray = Object.entries(clientRevenue)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      
      setClientData(clientDataArray);
      
      const itemRevenue: Record<string, number> = {};
      const itemCounts: Record<string, number> = {};
      
      invoices.forEach(invoice => {
        const invoiceItems = invoice.invoice_items || [];
        
        invoiceItems.forEach(item => {
          if (selectedItems.length === 0 || selectedItems.includes(item.item_id)) {
            const itemDetails = items.find(i => i.id === item.item_id);
            const itemName = itemDetails ? itemDetails.title : 'Unknown Item';
            
            if (invoice.status === 'paid') {
              itemRevenue[itemName] = (itemRevenue[itemName] || 0) + Number(item.total_amount);
            }
            
            itemCounts[itemName] = (itemCounts[itemName] || 0) + Number(item.quantity);
          }
        });
      });
      
      const itemDataArray = Object.entries(itemRevenue)
        .map(([name, amount]) => ({ 
          name, 
          amount,
          count: itemCounts[name] || 0
        }))
        .sort((a, b) => b.amount - a.amount);
      
      setItemData(itemDataArray);
      
      const reports: Report[] = [
        {
          id: '1',
          title: 'Monthly Revenue',
          data: monthlyDataArray,
          type: 'monthly',
          date: format(new Date(), 'yyyy-MM-dd')
        },
        {
          id: '2',
          title: 'Invoice Status',
          data: statusDataArray,
          type: 'status',
          date: format(new Date(), 'yyyy-MM-dd')
        },
        {
          id: '3',
          title: 'Top Clients',
          data: clientDataArray,
          type: 'client',
          date: format(new Date(), 'yyyy-MM-dd')
        }
      ];
      
      if (itemDataArray.length > 0) {
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

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  const handleExportReport = (report: Report) => {
    toast({
      title: "Export Started",
      description: `Exporting ${report.title} report...`,
    });
    
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `${report.title} report has been exported successfully!`,
      });
    }, 1500);
  };

  const clearFilters = () => {
    setSelectedItems([]);
    setSelectedClients([]);
    setSearchItemQuery('');
    setSearchClientQuery('');
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Reports & Analytics</h1>
            <p className="text-muted-foreground">View and analyze your business data</p>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <FilterIcon size={16} />
                  Filter by Items
                  {selectedItems.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary rounded-full text-xs font-medium">
                      {selectedItems.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72">
                <DropdownMenuLabel>Select Items</DropdownMenuLabel>
                <div className="px-2 py-2">
                  <Input
                    placeholder="Search items..."
                    value={searchItemQuery}
                    onChange={(e) => setSearchItemQuery(e.target.value)}
                    className="mb-2"
                  />
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto py-1">
                  {filteredItems.length === 0 ? (
                    <div className="px-2 py-2 text-sm text-muted-foreground">No items found</div>
                  ) : (
                    filteredItems.map((item) => (
                      <DropdownMenuCheckboxItem
                        key={item.id}
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                      >
                        <div className="flex flex-col">
                          <span>{item.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </div>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedItems([])}
                  >
                    Clear Item Filters
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Users size={16} />
                  Filter by Clients
                  {selectedClients.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary rounded-full text-xs font-medium">
                      {selectedClients.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72">
                <DropdownMenuLabel>Select Clients</DropdownMenuLabel>
                <div className="px-2 py-2">
                  <Input
                    placeholder="Search clients..."
                    value={searchClientQuery}
                    onChange={(e) => setSearchClientQuery(e.target.value)}
                    className="mb-2"
                  />
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto py-1">
                  {filteredClients.length === 0 ? (
                    <div className="px-2 py-2 text-sm text-muted-foreground">No clients found</div>
                  ) : (
                    filteredClients.map((client) => (
                      <DropdownMenuCheckboxItem
                        key={client.id}
                        checked={selectedClients.includes(client.id)}
                        onCheckedChange={() => toggleClientSelection(client.id)}
                      >
                        <span>{client.name}</span>
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </div>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedClients([])}
                  >
                    Clear Client Filters
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {(selectedItems.length > 0 || selectedClients.length > 0) && (
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear All Filters
            </Button>
          </div>
        )}
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[...Array(4)].map((_, index) => (
              <CustomCard key={index} padding="md">
                <div className="h-60" />
              </CustomCard>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <CustomCard>
                <h3 className="text-sm font-medium text-muted-foreground">Total Invoices</h3>
                <p className="text-2xl font-semibold mt-1">{invoiceStats.total}</p>
              </CustomCard>
              
              <CustomCard>
                <h3 className="text-sm font-medium text-muted-foreground">Paid Invoices</h3>
                <p className="text-2xl font-semibold mt-1 text-apple-green">{invoiceStats.paid}</p>
              </CustomCard>
              
              <CustomCard>
                <h3 className="text-sm font-medium text-muted-foreground">Pending</h3>
                <p className="text-2xl font-semibold mt-1 text-apple-orange">{invoiceStats.pending}</p>
              </CustomCard>
              
              <CustomCard>
                <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
                <p className="text-2xl font-semibold mt-1">{formatCurrency(invoiceStats.revenue)}</p>
              </CustomCard>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <CustomCard padding="md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Monthly Revenue</h3>
                  <BarChart3 size={20} className="text-muted-foreground" />
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{ top: 20, right: 30, left: 40, bottom: 70 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        vertical={false} 
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="month"
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        tick={{ 
                          fill: 'var(--muted-foreground)',
                          fontSize: 12 
                        }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={{ stroke: 'var(--border)' }}
                      />
                      <YAxis
                        tickFormatter={(value) => `${currencySymbol}${value}`}
                        width={80}
                        tick={{ 
                          fill: 'var(--muted-foreground)',
                          fontSize: 12 
                        }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={{ stroke: 'var(--border)' }}
                      />
                      <Tooltip 
                        cursor={false}
                        formatter={(value) => [`${formatCurrency(Number(value))}`, 'Revenue']}
                        contentStyle={{ 
                          background: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}
                        labelStyle={{ color: 'var(--foreground)' }}
                      />
                      <Bar 
                        dataKey="amount" 
                        fill="url(#colorRevenue)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CustomCard>
              
              <CustomCard padding="md" variant="elevated">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <PieChartIcon size={18} className="text-primary" />
                    <h3 className="text-lg font-medium">Invoice Status Distribution</h3>
                  </div>
                </div>
                
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        label={false}
                        outerRadius={120}
                        innerRadius={80}
                        paddingAngle={8}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="var(--background)"
                      >
                        {statusData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                            className="drop-shadow-md hover:opacity-85 transition-opacity cursor-pointer"
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        content={<EnhancedLegend />}
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CustomCard>
              
              <CustomCard padding="md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Top Clients by Revenue</h3>
                  <BarChart3 size={20} className="text-muted-foreground" />
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={clientData}
                      margin={{ top: 20, right: 30, left: 40, bottom: 70 }}
                    >
                      <defs>
                        <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        vertical={false}
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        tick={{ 
                          fill: 'var(--muted-foreground)',
                          fontSize: 12 
                        }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={{ stroke: 'var(--border)' }}
                      />
                      <YAxis
                        tickFormatter={(value) => `${currencySymbol}${value}`}
                        width={80}
                        tick={{ 
                          fill: 'var(--muted-foreground)',
                          fontSize: 12 
                        }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={{ stroke: 'var(--border)' }}
                      />
                      <Tooltip 
                        cursor={false}
                        formatter={(value) => [`${formatCurrency(Number(value))}`, 'Revenue']}
                        contentStyle={{ 
                          background: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}
                        labelStyle={{ color: 'var(--foreground)' }}
                      />
                      <Bar 
                        dataKey="amount" 
                        fill="url(#colorClients)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CustomCard>
              
              {selectedItems.length > 0 && itemData.length > 0 && (
                <CustomCard padding="md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Selected Items Revenue Analysis</h3>
                    <BarChart3 size={20} className="text-muted-foreground" />
                  </div>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={itemData}
                        margin={{ top: 20, right: 30, left: 40, bottom: 70 }}
                      >
                        <defs>
                          <linearGradient id="colorItems" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          vertical={false}
                          stroke="var(--border)"
                        />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          tick={{ 
                            fill: 'var(--muted-foreground)',
                            fontSize: 12 
                          }}
                          axisLine={{ stroke: 'var(--border)' }}
                          tickLine={{ stroke: 'var(--border)' }}
                        />
                        <YAxis
                          tickFormatter={(value) => `${currencySymbol}${value}`}
                          width={80}
                          tick={{ 
                            fill: 'var(--muted-foreground)',
                            fontSize: 12 
                          }}
                          axisLine={{ stroke: 'var(--border)' }}
                          tickLine={{ stroke: 'var(--border)' }}
                        />
                        <Tooltip 
                          cursor={false}
                          formatter={(value, name) => {
                            if (name === 'amount') return [`${formatCurrency(Number(value))}`, 'Revenue'];
                            if (name === 'count') return [value, 'Units Sold'];
                            return [value, name];
                          }}
                          contentStyle={{ 
                            background: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }}
                          labelStyle={{ color: 'var(--foreground)' }}
                        />
                        <Bar 
                          dataKey="amount" 
                          fill="url(#colorItems)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={50}
                          name="Revenue"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CustomCard>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Saved Reports</h2>
              
              <Table>
                <TableCaption>A list of your saved reports.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell>{report.type.charAt(0).toUpperCase() + report.type.slice(1)}</TableCell>
                      <TableCell>{report.date}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleExportReport(report)}
                          title="Export Report"
                        >
                          <Download size={18} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Reports;
