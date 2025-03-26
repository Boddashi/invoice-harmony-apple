
import React from "react";
import CustomCard from "../ui/CustomCard";

interface CreditNoteBasicInfoProps {
  invoiceNumber: string;
  issueDate: string;
  setInvoiceNumber: (value: string) => void;
  setIssueDate: (value: string) => void;
  prefix?: string;
}

const CreditNoteBasicInfo: React.FC<CreditNoteBasicInfoProps> = ({
  invoiceNumber,
  issueDate,
  setInvoiceNumber,
  setIssueDate,
  prefix
}) => {
  // Split the invoice number into prefix and number parts if available
  let displayNumber = invoiceNumber;
  if (prefix && invoiceNumber.startsWith(prefix)) {
    displayNumber = invoiceNumber.substring(prefix.length);
  }

  return (
    <CustomCard className="col-span-1 md:col-span-2">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-muted-foreground">Credit Note Number</label>
          <div className="flex items-center">
            {prefix && (
              <div className="bg-secondary px-3 py-2 rounded-l border border-r-0 border-input">
                {prefix}
              </div>
            )}
            <input 
              type="text" 
              value={displayNumber} 
              onChange={(e) => {
                if (prefix) {
                  setInvoiceNumber(prefix + e.target.value);
                } else {
                  setInvoiceNumber(e.target.value);
                }
              }}
              className={`input-field w-full ${prefix ? 'rounded-l-none' : ''}`}
              readOnly={!!prefix}
              required 
            />
          </div>
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
