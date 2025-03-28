
import React, { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import DashboardSummary from "../components/dashboard/DashboardSummary";
import InvoiceList from "../components/dashboard/InvoiceList";
import CreditNoteList from "../components/dashboard/CreditNoteList";
import { BarChart4 } from "lucide-react";
import CustomCard from "../components/ui/CustomCard";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

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

interface RevenueData {
  name: string;
  amount: number;
}

const Index = () => {
  const { currencySymbol } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    paid: 74,
    pending: 19,
    overdue: 7,
    topClients: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "monthly" | "quarterly" | "yearly"
  >("monthly");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const isMobile = useIsMobile();

  const formatAmount = (amount: number) => {
    return `${currencySymbol}${Math.abs(amount).toFixed(2)}`;
  };

  const fetchRevenueData = async () => {
    if (!user) return;
    try {
      const today = new Date();
      let startDate;

      switch (selectedPeriod) {
        case "monthly":
          startDate = subMonths(today, 6);
          break;
        case "quarterly":
          startDate = subMonths(today, 12);
          break;
        case "yearly":
          startDate = subMonths(today, 24);
          break;
        default:
          startDate = subMonths(today, 6);
      }
      
      // Fetch paid invoices
      const { data: invoices, error: invoiceError } = await supabase
        .from("invoices")
        .select("issue_date, total_amount")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .gte("issue_date", startOfMonth(startDate).toISOString())
        .lte("issue_date", endOfMonth(today).toISOString())
        .order("issue_date", { ascending: true });

      if (invoiceError) throw invoiceError;
      
      // Fetch paid credit notes
      const { data: creditNotes, error: creditNoteError } = await supabase
        .from("credit_notes")
        .select("issue_date, total_amount")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .gte("issue_date", startOfMonth(startDate).toISOString())
        .lte("issue_date", endOfMonth(today).toISOString())
        .order("issue_date", { ascending: true });
        
      if (creditNoteError) throw creditNoteError;

      const monthlyRevenue = new Map<string, number>();
      
      // Add invoice amounts
      invoices?.forEach((invoice) => {
        const monthKey = format(new Date(invoice.issue_date), "MMM yyyy");
        const currentAmount = monthlyRevenue.get(monthKey) || 0;
        monthlyRevenue.set(
          monthKey,
          currentAmount + Number(invoice.total_amount)
        );
      });
      
      // Subtract credit note amounts (use absolute value as credit notes are stored as negative)
      creditNotes?.forEach((creditNote) => {
        const monthKey = format(new Date(creditNote.issue_date), "MMM yyyy");
        const currentAmount = monthlyRevenue.get(monthKey) || 0;
        monthlyRevenue.set(
          monthKey,
          currentAmount - Math.abs(Number(creditNote.total_amount))
        );
      });
      
      const formattedData = Array.from(monthlyRevenue.entries()).map(
        ([name, amount]) => ({
          name,
          amount,
        })
      );
      setRevenueData(formattedData);
    } catch (error: any) {
      console.error("Error fetching revenue data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load revenue data.",
      });
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, [user, selectedPeriod, refreshTrigger]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        setIsLoading(true);

        // Fetch invoices with client data
        const { data: invoices, error: invoicesError } = await supabase
          .from("invoices")
          .select(
            `
            *,
            client:clients(name)
          `
          )
          .eq("user_id", user.id);
          
        if (invoicesError) {
          throw invoicesError;
        }
        
        // Fetch credit notes
        const { data: creditNotes, error: creditNotesError } = await supabase
          .from("credit_notes")
          .select("status, total_amount, client_id")
          .eq("user_id", user.id);
          
        if (creditNotesError) {
          throw creditNotesError;
        }

        // Calculate invoice amounts
        const totalInvoiceAmount =
          invoices?.reduce(
            (sum, invoice) => sum + Number(invoice.total_amount),
            0
          ) || 0;
          
        const paidInvoiceAmount =
          invoices
            ?.filter((i) => i.status === "paid")
            .reduce((sum, invoice) => sum + Number(invoice.total_amount), 0) ||
          0;
          
        const pendingAmount =
          invoices
            ?.filter((i) => i.status === "pending")
            .reduce((sum, invoice) => sum + Number(invoice.total_amount), 0) ||
          0;
          
        const overdueAmount =
          invoices
            ?.filter((i) => i.status === "overdue")
            .reduce((sum, invoice) => sum + Number(invoice.total_amount), 0) ||
          0;
        
        // Calculate credit note amounts (use absolute value for calculations)
        const paidCreditNoteAmount = 
          creditNotes
            ?.filter((cn) => cn.status === "paid")
            .reduce((sum, cn) => sum + Math.abs(Number(cn.total_amount)), 0) || 
          0;
        
        // Adjust total amount by subtracting credit notes
        const adjustedTotalAmount = totalInvoiceAmount - paidCreditNoteAmount;
        const adjustedPaidAmount = paidInvoiceAmount - paidCreditNoteAmount;
        
        // Calculate percentages based on adjusted amounts
        const effectiveTotalAmount = adjustedTotalAmount !== 0 ? adjustedTotalAmount : 1;
        
        const paidPercent =
          Math.round((adjustedPaidAmount / effectiveTotalAmount) * 100);
          
        const pendingPercent =
          Math.round((pendingAmount / effectiveTotalAmount) * 100);
          
        const overduePercent =
          Math.round((overdueAmount / effectiveTotalAmount) * 100);

        // Process client data with credit notes factored in
        const clientMap = new Map<
          string,
          {
            name: string;
            amount: number;
          }
        >();
        
        // Add invoice amounts per client
        invoices?.forEach((invoice) => {
          if (invoice.status === 'paid') {
            const clientName = invoice.client?.name || "Unknown Client";
            const clientId = invoice.client_id;
            if (clientMap.has(clientId)) {
              const current = clientMap.get(clientId)!;
              clientMap.set(clientId, {
                name: clientName,
                amount: current.amount + Number(invoice.total_amount),
              });
            } else {
              clientMap.set(clientId, {
                name: clientName,
                amount: Number(invoice.total_amount),
              });
            }
          }
        });
        
        // Subtract credit note amounts per client
        creditNotes?.forEach((creditNote) => {
          if (creditNote.status === 'paid' && creditNote.client_id) {
            const clientId = creditNote.client_id;
            if (clientMap.has(clientId)) {
              const current = clientMap.get(clientId)!;
              clientMap.set(clientId, {
                name: current.name,
                amount: current.amount - Math.abs(Number(creditNote.total_amount)),
              });
            }
          }
        });
        
        const topClients = Array.from(clientMap.values())
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 3);
          
        setStats({
          paid: paidPercent,
          pending: pendingPercent,
          overdue: overduePercent,
          topClients,
        });
      } catch (error: any) {
        console.error("Error fetching statistics:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to load statistics.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [user, toast, currencySymbol, refreshTrigger]);

  const handleDataRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };
  const chartConfig = {
    revenue: {
      label: "Revenue",
      theme: {
        light: "#8B5CF6",
        dark: "#8B5CF6",
      },
    },
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-7">
        <DashboardSummary />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <CustomCard
            className="lg:col-span-2 min-h-[300px] animate-slide-up"
            style={{
              animationDelay: "0.2s",
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Revenue</h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setSelectedPeriod("monthly")}
                  className={`px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm rounded-full transition-colors ${
                    selectedPeriod === "monthly"
                      ? "bg-apple-blue/10 text-apple-blue dark:bg-apple-purple/10 dark:text-apple-purple"
                      : "hover:bg-secondary"
                  }`}
                >
                  {isMobile ? "Month" : "Monthly"}
                </button>
                <button
                  onClick={() => setSelectedPeriod("quarterly")}
                  className={`px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm rounded-full transition-colors ${
                    selectedPeriod === "quarterly"
                      ? "bg-apple-blue/10 text-apple-blue  dark:bg-apple-purple/10 dark:text-apple-purple"
                      : "hover:bg-secondary"
                  }`}
                >
                  {isMobile ? "Quarter" : "Quarterly"}
                </button>
                <button
                  onClick={() => setSelectedPeriod("yearly")}
                  className={`px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm rounded-full transition-colors ${
                    selectedPeriod === "yearly"
                      ? "bg-apple-blue/10 text-apple-blue  dark:bg-apple-purple/10 dark:text-apple-purple"
                      : "hover:bg-secondary"
                  }`}
                >
                  {isMobile ? "Year" : "Yearly"}
                </button>
              </div>
            </div>

            <div className="h-[240px]">
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ChartContainer config={chartConfig}>
                    <AreaChart
                      data={revenueData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 12,
                        }}
                      />
                      <YAxis
                        tick={{
                          fontSize: 12,
                        }}
                        tickFormatter={(value) => `${currencySymbol}${Math.abs(value)}`}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value: number) => [
                              `${currencySymbol}${Math.abs(value).toFixed(2)}`,
                              value < 0 ? "Credit" : "Revenue",
                            ]}
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.1}
                      />
                    </AreaChart>
                  </ChartContainer>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="flex flex-col items-center">
                    <BarChart4 size={48} strokeWidth={1.25} />
                    <p className="mt-3">No revenue data available</p>
                  </div>
                </div>
              )}
            </div>
          </CustomCard>

          <CustomCard
            className="animate-slide-up"
            style={{
              animationDelay: "0.3s",
            }}
          >
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
                    <div
                      className="h-full rounded-full bg-apple-green"
                      style={{
                        width: `${stats.paid}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">
                      Pending
                    </span>
                    <span className="text-sm font-medium">
                      {stats.pending}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-apple-orange"
                      style={{
                        width: `${stats.pending}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">
                      Overdue
                    </span>
                    <span className="text-sm font-medium">
                      {stats.overdue}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-apple-red"
                      style={{
                        width: `${stats.overdue}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-5">
                  <h3 className="text-sm font-medium mb-3">Top Clients</h3>

                  {stats.topClients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No client data available
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {stats.topClients.map((client, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <span>{client.name}</span>
                          <span className="font-medium">
                            {formatAmount(client.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CustomCard>
        </div>

        <InvoiceList onStatusChange={handleDataRefresh} />
        
        <CreditNoteList onStatusChange={handleDataRefresh} />
      </div>
    </MainLayout>
  );
};

export default Index;
