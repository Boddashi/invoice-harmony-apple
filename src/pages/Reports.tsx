import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useCurrency } from '@/contexts/CurrencyContext';
import { createCurrencyFormatter } from '@/utils/formatCurrency';
import { useReportData } from '@/hooks/useReportData';
import type { TimePeriod } from '@/components/reports/charts/RevenueChart';

// Import Report Components
import ReportFilters from '@/components/reports/ReportFilters';
import StatCards from '@/components/reports/StatCards';
import RevenueChart from '@/components/reports/charts/RevenueChart';
import InvoiceStatusChart from '@/components/reports/charts/InvoiceStatusChart';
import TopClientsChart from '@/components/reports/charts/TopClientsChart';
import ItemsAnalysisChart from '@/components/reports/charts/ItemsAnalysisChart';
import SavedReportsTable from '@/components/reports/SavedReportsTable';

const Reports: React.FC = () => {
  const { currencySymbol } = useCurrency();
  const formatCurrency = createCurrencyFormatter(currencySymbol);
  
  const {
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
  } = useReportData();

  return (
    <MainLayout>
      <div className="space-y-8">
        <ReportFilters
          items={items}
          clients={clients}
          selectedItems={selectedItems}
          selectedClients={selectedClients}
          searchItemQuery={searchItemQuery}
          searchClientQuery={searchClientQuery}
          toggleItemSelection={toggleItemSelection}
          toggleClientSelection={toggleClientSelection}
          setSearchItemQuery={setSearchItemQuery}
          setSearchClientQuery={setSearchClientQuery}
          clearFilters={clearFilters}
          formatCurrency={formatCurrency}
        />
        
        {isLoading ? (
          <ReportsLoadingSkeleton />
        ) : (
          <ReportsContent 
            invoiceStats={invoiceStats}
            monthlyData={monthlyData}
            statusData={statusData}
            clientData={clientData}
            itemData={itemData}
            savedReports={savedReports}
            selectedItems={selectedItems}
            formatCurrency={formatCurrency}
            currencySymbol={currencySymbol}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        )}
      </div>
    </MainLayout>
  );
};

// Extract loading skeleton to a separate component
const ReportsLoadingSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="h-60 bg-muted rounded-lg" />
      ))}
    </div>
  );
};

// Extract reports content to a separate component
interface ReportsContentProps {
  invoiceStats: any;
  monthlyData: any[];
  statusData: any[];
  clientData: any[];
  itemData: any[];
  savedReports: any[];
  selectedItems: string[];
  formatCurrency: (amount: number) => string;
  currencySymbol: string;
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

const ReportsContent: React.FC<ReportsContentProps> = ({
  invoiceStats,
  monthlyData,
  statusData,
  clientData,
  itemData,
  savedReports,
  selectedItems,
  formatCurrency,
  currencySymbol,
  selectedPeriod,
  onPeriodChange
}) => {
  return (
    <>
      <StatCards 
        invoiceStats={invoiceStats} 
        formatCurrency={formatCurrency} 
      />
      
      <div className="grid grid-cols-1 gap-6">
        <RevenueChart 
          data={monthlyData} 
          currencySymbol={currencySymbol}
          formatCurrency={formatCurrency}
          onPeriodChange={onPeriodChange}
          selectedPeriod={selectedPeriod}
        />
        
        <InvoiceStatusChart data={statusData} />
        
        <TopClientsChart 
          data={clientData} 
          currencySymbol={currencySymbol}
          formatCurrency={formatCurrency}
        />
        
        {selectedItems.length > 0 && (
          <ItemsAnalysisChart 
            data={itemData} 
            currencySymbol={currencySymbol}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
      
      <SavedReportsTable 
        reports={savedReports}
      />
    </>
  );
};

export default Reports;
