
import React from "react";
import { Loader2, Download } from "lucide-react";

interface CreditNoteHeaderProps {
  isEditMode: boolean;
  pdfUrl: string | null;
  pdfGenerated?: boolean;
  creditNoteId?: string;
  isSubmitting: boolean;
  isGeneratingPDF: boolean;
  isSendingEmail: boolean;
  isSubmittingToStorecove?: boolean;
  isSendingToYuki?: boolean;
  status: "draft" | "pending" | "paid"; // Removed 'overdue' option
  handleDownloadPDF: () => void;
  handleSaveAsDraft: (e: React.MouseEvent) => void;
  handleCreateAndSend: (e: React.MouseEvent) => void;
  handleSendEmail?: () => void;
  handleCreateAndSendYuki?: (e: React.MouseEvent) => void;
}

const CreditNoteHeader: React.FC<CreditNoteHeaderProps> = ({
  isEditMode,
  pdfUrl,
  pdfGenerated,
  creditNoteId,
  isSubmitting,
  isGeneratingPDF,
  isSendingEmail,
  isSubmittingToStorecove,
  isSendingToYuki,
  status,
  handleDownloadPDF,
  handleSaveAsDraft,
  handleCreateAndSend,
  handleSendEmail,
  handleCreateAndSendYuki,
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
                  : isSendingToYuki
                  ? "Sending to Yuki..."
                  : "Saving..."}
              </span>
            </div>
          </div>
        ) : (
          <>
            {(pdfUrl || pdfGenerated) && (
              <button 
                onClick={handleDownloadPDF} 
                className="secondary-button flex items-center gap-2"
                type="button"
              >
                <Download size={16} />
                Download PDF
              </button>
            )}
            {status === "draft" && (
              <button 
                onClick={handleSaveAsDraft} 
                className="secondary-button"
                type="button"
              >
                Save as Draft
              </button>
            )}
            <button 
              onClick={handleCreateAndSend} 
              className="apple-button" 
              style={{ backgroundColor: "var(--apple-red, #FF3B30)" }}
              type="button"
            >
              Create & Send
            </button>
            {handleCreateAndSendYuki && (
              <button 
                onClick={handleCreateAndSendYuki} 
                className="yuki-button"
                type="button"
              >
                Create & Send & Yuki
              </button>
            )}
            {handleSendEmail && (pdfUrl || pdfGenerated) && (
              <button 
                onClick={handleSendEmail}
                className="apple-button" 
                style={{ backgroundColor: "var(--apple-red, #FF3B30)" }}
                type="button"
              >
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
