
import React from "react";
import { Input } from "../ui/input";
import CustomCard from "../ui/CustomCard";

interface CreditNoteBasicInfoProps {
  creditNoteNumber: string;
  issueDate: string;
  reference?: string;
  setCreditNoteNumber: (value: string) => void;
  setIssueDate: (value: string) => void;
  setReference?: (value: string) => void;
}

const CreditNoteBasicInfo: React.FC<CreditNoteBasicInfoProps> = ({
  creditNoteNumber,
  issueDate,
  reference = "",
  setCreditNoteNumber,
  setIssueDate,
  setReference = () => {},
}) => {
  return (
    <CustomCard className="col-span-1 md:col-span-2">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-muted-foreground">Credit Note Number</label>
          <Input 
            type="text" 
            value={creditNoteNumber} 
            onChange={e => setCreditNoteNumber(e.target.value)} 
            className="w-full" 
            required 
          />
        </div>
        
        <div className="space-y-1">
          <label className="block text-sm font-medium text-muted-foreground">Issue Date</label>
          <Input 
            type="date" 
            value={issueDate} 
            onChange={e => setIssueDate(e.target.value)} 
            className="w-full" 
            required 
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-muted-foreground">Reference (Optional)</label>
          <Input 
            type="text" 
            value={reference} 
            onChange={e => setReference(e.target.value)} 
            className="w-full" 
            placeholder="Invoice number or other reference" 
          />
        </div>
      </div>
    </CustomCard>
  );
};

export default CreditNoteBasicInfo;
