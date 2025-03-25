
import React from "react";
import CustomCard from "../ui/CustomCard";

interface CreditNoteNotesProps {
  notes: string;
  setNotes: (value: string) => void;
}

const CreditNoteNotes: React.FC<CreditNoteNotesProps> = ({ notes, setNotes }) => {
  return (
    <CustomCard>
      <h3 className="text-lg font-medium mb-4">Notes</h3>
      <div className="space-y-2">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes or payment terms..."
          className="input-field w-full min-h-[100px] resize-y"
        />
      </div>
    </CustomCard>
  );
};

export default CreditNoteNotes;
