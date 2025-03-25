import React, { useContext } from "react";
import { Loader2 } from "lucide-react";

interface InvoiceHeaderProps {
  isEditMode: boolean;
  pdfUrl: string | null;
  isSubmitting: boolean;
  isGeneratingPDF: boolean;
  isSendingEmail: boolean;
  isSubmittingToStorecove?: boolean;
  status: "draft" | "pending" | "paid" | "overdue";
  handleDownloadPDF: () => void;
  handleSaveAsDraft: (e: React.MouseEvent) => void;
  handleCreateAndSend: (e: React.MouseEvent) => void;
  handleCreateAndSendYuki?: (e: React.MouseEvent) => void;
  handleSendEmail?: () => void;
}

const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({
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
  handleCreateAndSendYuki,
  handleSendEmail,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">
          {isEditMode ? "Edit Invoice" : "New Invoice"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isEditMode
            ? "Update and manage your invoice details"
            : "Create a new invoice for your client"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
        {isSubmitting ? (
          <div className="w-full flex justify-center sm:w-auto">
            <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
              <Loader2 className="animate-spin" size={16} />
              <span>
                {isGeneratingPDF
                  ? "Generating PDF..."
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
            {handleCreateAndSendYuki && (
              <button onClick={handleCreateAndSendYuki} className="yuki-button">
                Create & Send & Yuki
              </button>
            )}
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

export default InvoiceHeader;
