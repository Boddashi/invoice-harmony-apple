
import React from "react";
import CustomCard from "../ui/CustomCard";

interface CreditNoteBasicInfoProps {
  invoiceNumber: string;
  issueDate: string;
  setInvoiceNumber: (value: string) => void;
  setIssueDate: (value: string) => void;
}

const CreditNoteBasicInfo: React.FC<CreditNoteBasicInfoProps> = ({
  invoiceNumber,
  issueDate,
  setInvoiceNumber,
  setIssueDate,
}) => {
  return (
    <CustomCard className="col-span-1 md:col-span-2">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-muted-foreground">Credit Note Number</label>
          <input 
            type="text" 
            value={invoiceNumber} 
            onChange={e => setInvoiceNumber(e.target.value)} 
            className="input-field w-full" 
            required 
          />
        </div>
        
        <div className="space-y-1">
          <label className="block text-sm font-medium text-muted-foreground">Issue Date</label>
          <input 
            type="date" 
            value={issueDate} 
            onChange={e => setIssueDate(e.target.value)} 
            className="input-field w-full" 
            required 
          />
        </div>
      </div>
    </CustomCard>
  );
};

export default CreditNoteBasicInfo;
