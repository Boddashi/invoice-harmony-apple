
import React from 'react';
import CustomCard from '../ui/CustomCard';
import { cn } from '@/lib/utils';

interface InvoiceBasicInfoProps {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status?: string;
  setInvoiceNumber?: (value: string) => void;
  setIssueDate?: (value: string) => void;
  setDueDate?: (value: string) => void;
  readOnly?: boolean;
}

const InvoiceBasicInfo: React.FC<InvoiceBasicInfoProps> = ({
  invoiceNumber,
  issueDate,
  dueDate,
  status,
  setInvoiceNumber,
  setIssueDate,
  setDueDate,
  readOnly = false
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isOverdue = () => {
    if (!readOnly || status !== 'overdue') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    return due < today;
  };

  return (
    <CustomCard className="col-span-1 md:col-span-2">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-muted-foreground">Invoice Number</label>
          {readOnly ? (
            <div className="py-2 font-medium">{invoiceNumber}</div>
          ) : (
            <input 
              type="text" 
              value={invoiceNumber} 
              onChange={e => setInvoiceNumber?.(e.target.value)} 
              className="input-field w-full" 
              required 
            />
          )}
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-muted-foreground">Issue Date</label>
            {readOnly ? (
              <div className="py-2">{formatDate(issueDate)}</div>
            ) : (
              <input 
                type="date" 
                value={issueDate} 
                onChange={e => setIssueDate?.(e.target.value)} 
                className="input-field w-full" 
                required 
              />
            )}
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-muted-foreground">Due Date</label>
            {readOnly ? (
              <div className={cn("py-2", isOverdue() && "text-apple-red font-medium")}>{formatDate(dueDate)}</div>
            ) : (
              <input 
                type="date" 
                value={dueDate} 
                onChange={e => setDueDate?.(e.target.value)} 
                className="input-field w-full" 
                required 
              />
            )}
          </div>
        </div>
      </div>
    </CustomCard>
  );
};

export default InvoiceBasicInfo;
