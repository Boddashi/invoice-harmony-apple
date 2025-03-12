
import React from 'react';
import { Download } from 'lucide-react';
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateReportPDF } from '@/utils/pdfGenerator';

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
        title: "Generating Report",
        description: "Please wait while we prepare your report...",
      });

      const fileName = `${report.title.toLowerCase().replace(/\s+/g, '-')}-${report.date}`;
      const pdfDataUrl = await generateReportPDF(report);
      
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = pdfDataUrl;
      link.download = `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

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
