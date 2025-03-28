import React from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Edit, Trash, Check, Clock, FileDown, Mail, Download, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreditNoteActionsProps {
  creditNoteId: string;
  status: string;
  onStatusChange: () => void;
}

const CreditNoteActions = ({ creditNoteId, status, onStatusChange }: CreditNoteActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/creditnotes/edit/${creditNoteId}`);
  };

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/creditnotes/view/${creditNoteId}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm("Are you sure you want to delete this credit note?");
    if (!confirmed) return;

    try {
      // Delete related credit note items first
      const { error: itemsError } = await supabase
        .from("credit_note_items")
        .delete()
        .eq("credit_note_id", creditNoteId);

      if (itemsError) {
        throw itemsError;
      }

      // Then delete the credit note
      const { error } = await supabase
        .from("credit_notes")
        .delete()
        .eq("id", creditNoteId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Credit note has been deleted.",
      });

      onStatusChange();
    } catch (error: any) {
      console.error("Error deleting credit note:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not delete the credit note.",
      });
    }
  };

  const handleStatusChange = async (newStatus: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const { error } = await supabase
        .from("credit_notes")
        .update({ status: newStatus })
        .eq("id", creditNoteId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `Credit note marked as ${newStatus}.`,
      });

      onStatusChange();
    } catch (error: any) {
      console.error("Error updating credit note status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not update the credit note status.",
      });
    }
  };

  const handleSendCreditNote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // First, update status to pending
      const { error: updateError } = await supabase
        .from("credit_notes")
        .update({ status: "pending" })
        .eq("id", creditNoteId);

      if (updateError) throw updateError;

      // Get credit note data for the edge function
      const { data: creditNoteData, error: fetchError } = await supabase
        .from("credit_notes")
        .select(`
          *,
          client:clients(*),
          items:credit_note_items(*, item:items(*))
        `)
        .eq("id", creditNoteId)
        .single();

      if (fetchError) throw fetchError;

      // Get company settings
      const { data: companyData, error: companyError } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", creditNoteData.user_id)
        .single();

      if (companyError && companyError.code !== 'PGRST116') throw companyError;

      // Trigger PDF generation through the edge function
      const { data: pdfResult, error: pdfError } = await supabase.functions
        .invoke('generate-pdf', {
          body: {
            type: 'credit-note',
            data: {
              id: creditNoteData.id,
              credit_note_number: creditNoteData.credit_note_number,
              issue_date: creditNoteData.issue_date,
              client_name: creditNoteData.client.name,
              client_address: `${creditNoteData.client.street || ''} ${creditNoteData.client.number || ''}, ${creditNoteData.client.postcode || ''} ${creditNoteData.client.city || ''}`,
              client_vat: creditNoteData.client.vat_number,
              items: creditNoteData.items.map((item: any) => ({
                description: item.item ? item.item.title : 'Unknown Item',
                quantity: item.quantity,
                unit_price: Math.abs(item.total_amount) / item.quantity,
                vat_rate: item.item?.vat || '21%',
                amount: -Math.abs(item.total_amount),
              })),
              subTotal: creditNoteData.amount,
              taxAmount: creditNoteData.tax_amount,
              total: creditNoteData.total_amount,
              notes: creditNoteData.notes,
              companySettings: companyData
            }
          }
        });

      if (pdfError) throw pdfError;

      toast({
        title: "Success",
        description: `Credit note sent successfully.`,
      });

      onStatusChange();
    } catch (error: any) {
      console.error("Error sending credit note:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not send the credit note.",
      });
    }
  };

  const handleDownloadPDF = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // First, check if the credit note has a PDF file already
      const { data, error } = await supabase
        .from("credit_notes")
        .select("id")
        .eq("id", creditNoteId)
        .single();

      if (error) throw error;

      // Get the public URL for the PDF
      const { data: urlData } = supabase.storage
        .from('credit_notes')
        .getPublicUrl(`${creditNoteId}/credit-note.pdf`);

      if (urlData && urlData.publicUrl) {
        window.open(urlData.publicUrl, '_blank');
      } else {
        throw new Error("PDF file not found");
      }
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not download the credit note PDF.",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-2 hover:bg-muted rounded-full"
          aria-label="More actions"
        >
          <MoreHorizontal size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>

        {status === "draft" && (
          <DropdownMenuItem onClick={handleSendCreditNote}>
            <Send className="w-4 h-4 mr-2" />
            Send
          </DropdownMenuItem>
        )}

        {status === "pending" && (
          <DropdownMenuItem onClick={(e) => handleStatusChange("paid", e)}>
            <Check className="w-4 h-4 mr-2" />
            Mark as Paid
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {(status === "pending" || status === "paid") && (
          <DropdownMenuItem onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </DropdownMenuItem>
        )}

        {status === "draft" ? (
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleView}>
            <FileDown className="w-4 h-4 mr-2" />
            View
          </DropdownMenuItem>
        )}

        {status === "draft" && (
          <DropdownMenuItem onClick={handleDelete}>
            <Trash className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CreditNoteActions;
