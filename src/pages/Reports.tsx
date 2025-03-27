
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useCurrency } from '@/contexts/CurrencyContext';
import { createCurrencyFormatter } from '@/utils/formatCurrency';
import { useReportData } from '@/hooks/useReportData';
import type { TimePeriod } from '@/components/reports/charts/RevenueChart';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { FileText, Receipt } from 'lucide-react';

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
  const [reportSource, setReportSource] = useState<'invoices' | 'credit-notes'>('invoices');
  
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
  } = useReportData(reportSource);

  const handleReportSourceChange = (value: string) => {
    if (value === 'invoices' || value === 'credit-notes') {
      setReportSource(value);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <div className="ml-auto">
            <ToggleGroup 
              type="single" 
              value={reportSource} 
              onValueChange={handleReportSourceChange}
              className="border rounded-lg"
            >
              <ToggleGroupItem value="invoices" className="flex items-center gap-1 px-4">
                <FileText size={16} />
                <span>Invoices</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="credit-notes" className="flex items-center gap-1 px-4">
                <Receipt size={16} />
                <span>Credit Notes</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

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
          reportSource={reportSource}
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
            reportSource={reportSource}
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
  reportSource: 'invoices' | 'credit-notes';
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
  onPeriodChange,
  reportSource
}) => {
  const title = reportSource === 'invoices' ? 'Invoice' : 'Credit Note';
  
  return (
    <>
      <StatCards 
        invoiceStats={invoiceStats} 
        formatCurrency={formatCurrency}
        reportSource={reportSource}
      />
      
      <div className="grid grid-cols-1 gap-4">
        <RevenueChart 
          data={monthlyData} 
          currencySymbol={currencySymbol}
          formatCurrency={formatCurrency}
          onPeriodChange={onPeriodChange}
          selectedPeriod={selectedPeriod}
          title={`${title} Revenue`}
        />
        
        <InvoiceStatusChart 
          data={statusData} 
          title={`${title} Status`}
        />
        
        <TopClientsChart 
          data={clientData} 
          currencySymbol={currencySymbol}
          formatCurrency={formatCurrency}
          reportSource={reportSource}
        />
        
        {selectedItems.length > 0 && (
          <ItemsAnalysisChart 
            data={itemData} 
            currencySymbol={currencySymbol}
            formatCurrency={formatCurrency}
            reportSource={reportSource}
          />
        )}
      </div>
      
      <SavedReportsTable 
        reports={savedReports}
        selectedPeriod={selectedPeriod}
        reportSource={reportSource}
      />
    </>
  );
};

export default Reports;
