
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
    <CustomCard>
      <h3 className="text-lg font-medium mb-4">Credit Note Details</h3>
      <div className="grid grid-cols-1 gap-5">
        <div>
          <label htmlFor="invoiceNumber" className="block text-sm font-medium mb-1">
            Credit Note Number
          </label>
          <input
            id="invoiceNumber"
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="input-field w-full"
            required
          />
        </div>
        <div>
          <label htmlFor="issueDate" className="block text-sm font-medium mb-1">
            Issue Date
          </label>
          <input
            id="issueDate"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="input-field w-full"
            required
          />
        </div>
      </div>
    </CustomCard>
  );
};

export default CreditNoteBasicInfo;
