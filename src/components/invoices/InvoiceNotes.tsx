
import React from 'react';
import CustomCard from '../ui/CustomCard';

interface InvoiceNotesProps {
  notes: string;
  setNotes?: (value: string) => void;
  readOnly?: boolean;
}

const InvoiceNotes: React.FC<InvoiceNotesProps> = ({ notes, setNotes, readOnly = false }) => {
  return (
    <CustomCard>
      <h3 className="text-lg font-medium mb-4">Notes</h3>
      
      {readOnly ? (
        <div className="whitespace-pre-wrap">{notes || "No notes provided"}</div>
      ) : (
        <textarea 
          value={notes} 
          onChange={e => setNotes?.(e.target.value)} 
          placeholder="Payment terms, delivery notes, or any other relevant information" 
          className="input-field w-full min-h-[120px]" 
        />
      )}
    </CustomCard>
  );
};

export default InvoiceNotes;
