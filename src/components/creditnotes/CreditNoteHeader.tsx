
import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreditNoteHeaderProps {
  isEditMode: boolean;
  pdfUrl: string | null;
  isSubmitting: boolean;
  isGeneratingPDF: boolean;
  isSendingEmail: boolean;
  isSubmittingToStorecove?: boolean;
  status: "draft" | "pending" | "paid"; // Removed 'overdue' option
  handleDownloadPDF: () => void;
  handleSaveAsDraft: (e: React.MouseEvent) => void;
  handleCreateAndSend: (e: React.MouseEvent) => void;
  handleSendEmail?: () => void;
}

const CreditNoteHeader: React.FC<CreditNoteHeaderProps> = ({
  isEditMode,
  pdfUrl,
  isSubmitting,
  isGeneratingPDF,
  isSendingEmail,
  isSubmittingToStorecove,
  status,
  handleDownloadPDF,
  handleSaveAsDraft,
  handleCreateAndSend,
  handleSendEmail,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">
          {isEditMode ? "Edit Credit Note" : "New Credit Note"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isEditMode
            ? "Update and manage your credit note details"
            : "Create a new credit note for your client"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
        {isSubmitting ? (
          <div className="w-full flex justify-center sm:w-auto">
            <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
              <Loader2 className="animate-spin" size={16} />
              <span>
                {isGeneratingPDF
                  ? "Generating high-quality PDF..."
                  : isSendingEmail
                  ? "Sending email..."
                  : isSubmittingToStorecove
                  ? "Submitting to Storecove..."
                  : "Saving..."}
              </span>
            </div>
          </div>
        ) : (
          <>
            {pdfUrl && (
              <Button 
                variant="outline" 
                onClick={handleDownloadPDF}
              >
                Download PDF
              </Button>
            )}
            {status === "draft" ? (
              <Button 
                variant="outline" 
                onClick={handleSaveAsDraft}
              >
                Save as Draft
              </Button>
            ) : null}
            <Button
              onClick={handleCreateAndSend}
              className="bg-apple-red hover:bg-apple-red/90"
            >
              Create & Send
            </Button>
            {handleSendEmail && (
              <Button
                onClick={handleSendEmail}
                className="bg-apple-red hover:bg-apple-red/90"
              >
                Send Email
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CreditNoteHeader;
