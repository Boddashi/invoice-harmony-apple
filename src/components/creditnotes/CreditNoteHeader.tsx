
import React from "react";
import { Loader2, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreditNoteHeaderProps {
  isEditMode: boolean;
  pdfUrl: string | null;
  pdfGenerated?: boolean;
  creditNoteId?: string;
  isSubmitting: boolean;
  isGeneratingPDF: boolean;
  isSendingEmail: boolean;
  isSubmittingToStorecove?: boolean;
  status: "draft" | "pending" | "paid";
  handleDownloadPDF: () => void;
  handleSaveAsDraft: (e: React.MouseEvent) => void;
  handleCreateAndSend: (e: React.MouseEvent) => void;
  handleCreateAndSendYuki?: (e: React.MouseEvent) => void;
  handleSendEmail?: () => void;
}

const CreditNoteHeader: React.FC<CreditNoteHeaderProps> = ({
  isEditMode,
  pdfUrl,
  pdfGenerated,
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
            {(pdfUrl || pdfGenerated) && (
              <Button 
                onClick={handleDownloadPDF} 
                variant="outline"
                className="flex items-center gap-2"
                type="button"
              >
                <Download size={16} />
                Download PDF
              </Button>
            )}
            {status === "draft" && (
              <Button 
                onClick={handleSaveAsDraft} 
                variant="outline"
                type="button"
              >
                Save as Draft
              </Button>
            )}
            <Button 
              onClick={handleCreateAndSend} 
              variant="apple" 
              style={{ backgroundColor: "var(--apple-red, #FF3B30)" }}
              type="button"
            >
              Create & Send
            </Button>
            {handleCreateAndSendYuki && (
              <Button 
                onClick={handleCreateAndSendYuki}
                variant="apple" 
                style={{ backgroundColor: "var(--apple-blue, #007AFF)" }}
                type="button"
                className="flex items-center gap-2"
              >
                <Mail size={16} />
                Create & Send & Yuki
              </Button>
            )}
            {handleSendEmail && (pdfUrl || pdfGenerated) && (
              <Button 
                onClick={handleSendEmail}
                variant="apple" 
                style={{ backgroundColor: "var(--apple-red, #FF3B30)" }}
                type="button"
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
