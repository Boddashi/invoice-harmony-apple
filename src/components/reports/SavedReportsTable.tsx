
import React from 'react';
import { Download } from 'lucide-react';
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface Report {
  id: string;
  title: string;
  data: any;
  type: 'monthly' | 'status' | 'client' | 'item';
  date: string;
}

interface SavedReportsTableProps {
  reports: Report[];
  onExport: (report: Report) => void;
}

const SavedReportsTable: React.FC<SavedReportsTableProps> = ({ reports, onExport }) => {
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
                  onClick={() => onExport(report)}
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
