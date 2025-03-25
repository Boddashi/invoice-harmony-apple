
import React from "react";
import { Loader2 } from "lucide-react";

interface CreditNoteHeaderProps {
  isEditMode: boolean;
  pdfUrl: string | null;
  isSubmitting: boolean;
  isGeneratingPDF: boolean;
  isSendingEmail: boolean;
  status: "draft" | "pending" | "paid" | "overdue";
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
                  : "Saving..."}
              </span>
            </div>
          </div>
        ) : (
          <>
            {pdfUrl && (
              <button onClick={handleDownloadPDF} className="secondary-button">
                Download PDF
              </button>
            )}
            {status === "draft" ? (
              <button onClick={handleSaveAsDraft} className="secondary-button">
                Save as Draft
              </button>
            ) : null}
            <button onClick={handleCreateAndSend} className="apple-button">
              Create & Send
            </button>
            {handleSendEmail && (
              <button onClick={handleSendEmail} className="apple-button">
                Send Email
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CreditNoteHeader;
