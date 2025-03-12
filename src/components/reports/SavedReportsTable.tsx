import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TimePeriod } from '@/components/reports/charts/RevenueChart';

interface Report {
  id: string;
  title: string;
  data: any;
  type: 'monthly' | 'status' | 'client' | 'item';
  date: string;
  period?: TimePeriod;
}

interface SavedReportsTableProps {
  reports: Report[];
  selectedPeriod: TimePeriod;
}

const SavedReportsTable: React.FC<SavedReportsTableProps> = ({ reports, selectedPeriod }) => {
  const { toast } = useToast();

  const handleExport = async (report: Report) => {
    try {
      toast({
        title: "Generating CSV",
        description: "Please wait while we prepare your report...",
      });

      let csvContent = "";
      
      if (report.type === 'monthly') {
        const periodLabel = getPeriodLabel(selectedPeriod);
        csvContent = `Period,${periodLabel} Revenue\n`;
        report.data.forEach((item: any) => {
          csvContent += `"${item.period}",${item.amount}\n`;
        });
      } else if (report.type === 'status') {
        csvContent = "Status,Count,Percentage\n";
        report.data.forEach((item: any) => {
          csvContent += `"${item.name}",${item.value},${(item.percent * 100).toFixed(2)}%\n`;
        });
      } else if (report.type === 'client') {
        csvContent = "Client,Revenue\n";
        report.data.forEach((item: any) => {
          csvContent += `"${item.name}",${item.amount}\n`;
        });
      } else if (report.type === 'item') {
        csvContent = "Item,Revenue,Count\n";
        report.data.forEach((item: any) => {
          csvContent += `"${item.name}",${item.amount},${item.count}\n`;
        });
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const periodSuffix = report.type === 'monthly' ? `-${selectedPeriod}` : '';
      const fileName = `${report.title.toLowerCase().replace(/\s+/g, '-')}${periodSuffix}-${report.date}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Your report has been exported successfully!",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "There was an error exporting your report. Please try again.",
      });
    }
  };

  const getPeriodLabel = (period: TimePeriod): string => {
    switch (period) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return 'Monthly';
    }
  };

  const getTypeColor = (type: string, reportType: string) => {
    if (type === 'monthly' && reportType === 'Revenue') {
      switch (selectedPeriod) {
        case 'daily': return 'bg-cyan-100 text-cyan-800';
        case 'weekly': return 'bg-indigo-100 text-indigo-800';
        case 'monthly': return 'bg-blue-100 text-blue-800';
        case 'yearly': return 'bg-violet-100 text-violet-800';
        default: return 'bg-blue-100 text-blue-800';
      }
    }
    
    switch (type) {
      case 'status': return 'bg-green-100 text-green-800';
      case 'client': return 'bg-purple-100 text-purple-800';
      case 'item': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Export Reports</h2>
      
      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No reports available for export.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden transition-all hover:shadow-md">
              <CardContent className="p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium truncate" title={report.title}>
                        {report.type === 'monthly' 
                          ? `${getPeriodLabel(selectedPeriod)} Revenue` 
                          : report.title}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={getTypeColor(report.type, report.title)}
                      >
                        {report.type === 'monthly' 
                          ? getPeriodLabel(selectedPeriod)
                          : report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{report.date}</p>
                  </div>
                  
                  <div className="p-4 mt-auto flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport(report)}
                      className="flex items-center gap-2"
                    >
                      <FileText size={16} />
                      <span>Export CSV</span>
                      <Download size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedReportsTable;
