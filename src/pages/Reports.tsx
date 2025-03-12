
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
import { FileText, BarChart3, Download } from 'lucide-react';
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
  Legend
} from 'recharts';

type Report = {
  id: string;
  title: string;
  data: any;
  type: 'monthly' | 'status' | 'client';
  date: string;
};

type InvoiceStats = {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  revenue: number;
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
  const [savedReports, setSavedReports] = useState<Report[]>([]);

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  useEffect(() => {
    if (user) {
      fetchInvoiceData();
    }
  }, [user]);

  const fetchInvoiceData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Fetch all invoices for the user
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, client:clients(name)')
        .eq('user_id', user.id);
      
      if (invoicesError) throw invoicesError;
      
      if (!invoices || invoices.length === 0) {
        setIsLoading(false);
        return;
      }
      
      // Calculate basic statistics
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
      
      // Generate monthly data
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
      
      // Generate status data for pie chart
      const statusDataArray = [
        { name: 'Paid', value: paidInvoices.length },
        { name: 'Pending', value: pendingInvoices.length },
        { name: 'Overdue', value: overdueInvoices.length }
      ];
      
      setStatusData(statusDataArray);
      
      // Generate client data
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
        .slice(0, 5); // Top 5 clients
      
      setClientData(clientDataArray);
      
      // Fetch saved reports (if we had them in the database)
      // This would typically come from a reports table
      setSavedReports([
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
      ]);
      
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
  
  const handleGenerateReport = async () => {
    toast({
      title: "Report Generated",
      description: "Your report has been created and added to the list."
    });
    
    // Here we would typically save the report to the database
    // and then refresh the list of reports
    await fetchInvoiceData();
  };
  
  const handleExportReport = (report: Report) => {
    // In a real implementation, this would generate a CSV or PDF
    toast({
      title: "Report Exported",
      description: `${report.title} has been exported to CSV.`
    });
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Reports & Analytics</h1>
            <p className="text-muted-foreground">View and analyze your business data</p>
          </div>
          
          <Button onClick={handleGenerateReport} className="flex items-center gap-2">
            <FileText size={18} />
            Generate New Report
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[...Array(4)].map((_, index) => (
              <CustomCard key={index} className="h-60" />
            ))}
          </div>
        ) : (
          <>
            {/* Summary Statistics */}
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
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Revenue Chart */}
              <CustomCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Monthly Revenue</h3>
                  <BarChart3 size={20} className="text-muted-foreground" />
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" angle={-45} textAnchor="end" height={70} />
                      <YAxis tickFormatter={(value) => `${currencySymbol}${value}`} />
                      <Tooltip formatter={(value) => [`${formatCurrency(Number(value))}`, 'Revenue']} />
                      <Bar dataKey="amount" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CustomCard>
              
              {/* Invoice Status Chart */}
              <CustomCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Invoice Status</h3>
                  <BarChart3 size={20} className="text-muted-foreground" />
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CustomCard>
              
              {/* Top Clients */}
              <CustomCard className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Top Clients by Revenue</h3>
                  <BarChart3 size={20} className="text-muted-foreground" />
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={clientData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                      <YAxis tickFormatter={(value) => `${currencySymbol}${value}`} />
                      <Tooltip formatter={(value) => [`${formatCurrency(Number(value))}`, 'Revenue']} />
                      <Bar dataKey="amount" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CustomCard>
            </div>
            
            {/* Saved Reports */}
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
