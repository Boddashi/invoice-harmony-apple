
import React from "react";
import { Input } from "../ui/input";
import CustomCard from "../ui/CustomCard";

interface CreditNoteBasicInfoProps {
  creditNoteNumber: string;
  issueDate: string;
  reference?: string;
  setCreditNoteNumber?: (value: string) => void;
  setIssueDate?: (value: string) => void;
  setReference?: (value: string) => void;
  readOnly?: boolean;
  selectedClientId?: string;
  clients?: any[];
  setSelectedClientId?: (value: string) => void;
  isAddClientModalOpen?: boolean;
  setIsAddClientModalOpen?: (value: boolean) => void;
  isEditMode?: boolean;
}

const CreditNoteBasicInfo: React.FC<CreditNoteBasicInfoProps> = ({
  creditNoteNumber,
  issueDate,
  reference = "",
  setCreditNoteNumber = () => {},
  setIssueDate = () => {},
  setReference = () => {},
  readOnly = false,
  // Additional props that might be passed but not used directly in this component
  selectedClientId,
  clients,
  setSelectedClientId,
  isAddClientModalOpen,
  setIsAddClientModalOpen,
  isEditMode,
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <CustomCard className="col-span-1 md:col-span-2">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-muted-foreground">Credit Note Number</label>
          {readOnly ? (
            <div className="px-3 py-2 bg-muted/30 rounded-md">{creditNoteNumber}</div>
          ) : (
            <Input 
              type="text" 
              value={creditNoteNumber} 
              onChange={e => setCreditNoteNumber(e.target.value)} 
              className="w-full" 
              required 
              disabled={readOnly}
            />
          )}
        </div>
        
        <div className="space-y-1">
          <label className="block text-sm font-medium text-muted-foreground">Issue Date</label>
          {readOnly ? (
            <div className="px-3 py-2 bg-muted/30 rounded-md">{formatDate(issueDate)}</div>
          ) : (
            <Input 
              type="date" 
              value={issueDate} 
              onChange={e => setIssueDate(e.target.value)} 
              className="w-full" 
              required 
              disabled={readOnly}
            />
          )}
        </div>

        {reference !== undefined && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-muted-foreground">Reference (Optional)</label>
            {readOnly ? (
              <div className="px-3 py-2 bg-muted/30 rounded-md">{reference || "No reference"}</div>
            ) : (
              <Input 
                type="text" 
                value={reference} 
                onChange={e => setReference(e.target.value)} 
                className="w-full" 
                placeholder="Invoice number or other reference" 
                disabled={readOnly}
              />
            )}
          </div>
        )}
      </div>
    </CustomCard>
  );
};

export default CreditNoteBasicInfo;
