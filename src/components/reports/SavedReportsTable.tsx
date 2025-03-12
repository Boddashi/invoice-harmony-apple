
import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Report {
  id: string;
  title: string;
  data: any;
  type: 'monthly' | 'status' | 'client' | 'item';
  date: string;
}

interface SavedReportsTableProps {
  reports: Report[];
}

const SavedReportsTable: React.FC<SavedReportsTableProps> = ({ reports }) => {
  const { toast } = useToast();

  const handleExport = async (report: Report) => {
    try {
      toast({
        title: "Generating CSV",
        description: "Please wait while we prepare your report...",
      });

      // Convert report data to CSV format
      let csvContent = "";
      
      // Define headers and content based on report type
      if (report.type === 'monthly') {
        csvContent = "Period,Amount\n";
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
      
      // Create a Blob with the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create a link element and trigger download
      const fileName = `${report.title.toLowerCase().replace(/\s+/g, '-')}-${report.date}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'monthly': return 'bg-blue-100 text-blue-800';
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
                        {report.title}
                      </h3>
                      <Badge variant="outline" className={getTypeColor(report.type)}>
                        {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
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
