
import React from 'react';
import { Download } from 'lucide-react';
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Export Reports</h2>
      
      <Table>
        <TableCaption>A list of reports available for export.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Report</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell className="font-medium">{report.title}</TableCell>
              <TableCell>{report.type.charAt(0).toUpperCase() + report.type.slice(1)}</TableCell>
              <TableCell>{report.date}</TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleExport(report)}
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
  );
};

export default SavedReportsTable;
