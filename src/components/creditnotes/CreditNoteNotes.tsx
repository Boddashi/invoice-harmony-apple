
import React from "react";
import CustomCard from "../ui/CustomCard";

interface CreditNoteNotesProps {
  notes: string;
  setNotes?: (value: string) => void;
  readOnly?: boolean;
}

const CreditNoteNotes: React.FC<CreditNoteNotesProps> = ({ 
  notes, 
  setNotes = () => {}, 
  readOnly = false 
}) => {
  return (
    <CustomCard>
      <h3 className="text-lg font-medium mb-4">Notes</h3>
      <div className="space-y-2">
        {readOnly ? (
          <div className="p-3 bg-muted/30 rounded-md whitespace-pre-wrap min-h-[100px]">
            {notes || "No notes provided"}
          </div>
        ) : (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes or payment terms..."
            className="input-field w-full min-h-[100px] resize-y"
            disabled={readOnly}
          />
        )}
      </div>
    </CustomCard>
  );
};

export default CreditNoteNotes;
