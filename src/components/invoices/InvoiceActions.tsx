import React from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Download,
  Send,
  Check,
  Bell,
  FileDown,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { generateInvoicePDF } from "@/utils/pdfGenerator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InvoiceActionsProps {
  invoiceId: string;
  status: string;
  onStatusChange?: () => void;
}

const InvoiceActions = ({
  invoiceId,
  status,
  onStatusChange,
}: InvoiceActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [isMarkingAsPaid, setIsMarkingAsPaid] = React.useState(false);
  const [isSendingReminder, setIsSendingReminder] = React.useState(false);

  const handleEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate(`/invoices/edit/${invoiceId}`);
  };

  const handleView = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate(`/invoices/${invoiceId}`);
  };

  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      if (status === "draft") {
        toast({
          title: "Info",
          description:
            "Draft invoices don't have PDF versions. Send the invoice first to generate a PDF.",
        });
        return;
      }

      const { data } = supabase.storage
        .from("invoices")
        .getPublicUrl(`${invoiceId}/invoice.pdf`);

      if (data && data.publicUrl) {
        const link = document.createElement("a");
        link.href = data.publicUrl;
        link.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "PDF not found. Please try regenerating the invoice.",
        });
      }
    } catch (error: any) {
      console.error("Error downloading invoice PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to download PDF.",
      });
    }
  };

  const handleSend = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isSending) return;

    setIsSending(true);
    try {
      const { data: invoiceItems, error: itemsError } = await supabase
        .from("invoice_items")
        .select("quantity")
        .eq("invoice_id", invoiceId);

      if (itemsError) {
        if (
          itemsError.message?.includes("column invoice_items.id does not exist")
        ) {
          throw new Error(
            "We're experiencing a technical issue with the invoice system. Our team has been notified."
          );
        }
        throw itemsError;
      }

      if (!invoiceItems || invoiceItems.length === 0) {
        toast({
          variant: "destructive",
          title: "Cannot Send Invoice",
          description:
            "This invoice has no items. Please add at least one item before sending.",
        });
        return;
      }

      const { error: updateError } = await supabase
        .from("invoices")
        .update({ status: "pending" })
        .eq("id", invoiceId);

      if (updateError) throw updateError;

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select(
          `
          *,
          client:clients(*)
        `
        )
        .eq("id", invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: detailedInvoiceItems, error: detailedItemsError } =
        await supabase
          .from("invoice_items")
          .select(
            `
          *,
          items:item_id(*)
        `
          )
          .eq("invoice_id", invoiceId);

      if (detailedItemsError) throw detailedItemsError;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!invoice || !detailedInvoiceItems || !user) {
        throw new Error("Could not retrieve all required data");
      }

      const itemsForPDF = detailedInvoiceItems.map((item) => {
        const itemData = item.items;
        return {
          description: itemData.title,
          quantity: item.quantity,
          unit_price: item.total_amount / item.quantity,
          amount: item.total_amount,
          vat_rate: itemData.vat,
        };
      });

      const subTotal = detailedInvoiceItems.reduce(
        (sum, item) => sum + Number(item.total_amount),
        0
      );
      const taxAmount = invoice.tax_amount || 0;

      const { data: settings } = await supabase
        .from("company_settings")
        .select(
          "default_currency, company_name, legal_entity_id, terms_and_conditions_url, iban"
        )
        .eq("user_id", user.id)
        .single();

      const currencySymbol = "€";

      const pdfBase64 = await generateInvoicePDF({
        id: invoiceId,
        invoice_number: invoice.invoice_number,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        client_name: invoice.client?.name || "Client",
        user_email: user.email || "",
        items: itemsForPDF,
        subTotal,
        taxAmount,
        total: Number(invoice.total_amount),
        notes: invoice.notes,
        currencySymbol,
      });

      const pdfBlob = await fetch(pdfBase64).then((res) => res.blob());

      await supabase.storage
        .from("invoices")
        .upload(`${invoiceId}/invoice.pdf`, pdfBlob, {
          upsert: true,
          cacheControl: "3600",
        });

      const { data: urlData } = supabase.storage
        .from("invoices")
        .getPublicUrl(`${invoiceId}/invoice.pdf`);

      if (invoice.client?.legal_entity_id && settings?.legal_entity_id) {
        try {
          const response = await supabase.functions.invoke(
            "submit-invoice-document",
            {
              body: {
                invoice: {
                  id: invoiceId,
                  invoice_number: invoice.invoice_number,
                  issue_date: invoice.issue_date,
                  due_date: invoice.due_date,
                  notes: invoice.notes,
                  total_amount: invoice.total_amount,
                },
                client: invoice.client,
                items: itemsForPDF,
                companySettings: settings,
                pdfBase64: pdfBase64,
                pdfUrl: urlData?.publicUrl || null,
              },
            }
          );

          if (response.error) {
            throw new Error(
              response.error.message || "Failed to submit to Storecove"
            );
          }

          if (response.data?.error) {
            throw new Error(response.data.error);
          }

          toast({
            title: "Success",
            description: "Invoice submitted to Storecove and sent via email",
          });
        } catch (storecoveError: any) {
          console.error("Error submitting to Storecove:", storecoveError);

          await supabase.functions.invoke("send-invoice-email", {
            body: {
              clientName: invoice.client?.name || "Client",
              clientEmail: invoice.client?.email,
              invoiceNumber: invoice.invoice_number,
              pdfUrl: urlData?.publicUrl || null,
              termsAndConditionsUrl: settings?.terms_and_conditions_url || null,
              companyName: settings?.company_name || "PowerPeppol",
              includeAttachments: true,
              pdfBase64: pdfBase64,
            },
          });

          toast({
            title: "Partial Success",
            description:
              "Invoice sent via email, but Storecove submission failed: " +
              storecoveError.message,
          });
        }
      } else {
        await supabase.functions.invoke("send-invoice-email", {
          body: {
            clientName: invoice.client?.name || "Client",
            clientEmail: invoice.client?.email,
            invoiceNumber: invoice.invoice_number,
            pdfUrl: urlData?.publicUrl || null,
            termsAndConditionsUrl: settings?.terms_and_conditions_url || null,
            companyName: settings?.company_name || "PowerPeppol",
            includeAttachments: true,
            pdfBase64: pdfBase64,
          },
        });

        toast({
          title: "Success",
          description: "Invoice sent successfully with PDF attachment",
        });
      }

      if (onStatusChange) {
        onStatusChange();
      }

      navigate("/invoices", { replace: true });
    } catch (error: any) {
      console.error("Error sending invoice:", error);

      let errorMessage = "Failed to send invoice";

      if (error.message?.includes("column invoice_items.id does not exist")) {
        errorMessage =
          "We're experiencing a technical issue with the invoice system. Our team has been notified.";
      } else if (error.message?.includes("database")) {
        errorMessage =
          "We're having trouble connecting to our database. Please try again later.";
      } else if (error.message?.includes("permission denied")) {
        errorMessage =
          "You don't have permission to perform this action. Please contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkAsPaid = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isMarkingAsPaid) return;

    setIsMarkingAsPaid(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "paid" })
        .eq("id", invoiceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice marked as paid",
      });

      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error: any) {
      console.error("Error marking invoice as paid:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to mark invoice as paid",
      });
    } finally {
      setIsMarkingAsPaid(false);
    }
  };

  const handleSendReminder = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isSendingReminder) return;

    setIsSendingReminder(true);
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select(
          `
          *,
          client:clients(*)
        `
        )
        .eq("id", invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: settings } = await supabase
        .from("company_settings")
        .select("default_currency")
        .single();

      const currencySymbol =
        settings?.default_currency === "USD"
          ? "$"
          : settings?.default_currency === "EUR"
          ? "€"
          : settings?.default_currency === "GBP"
          ? "£"
          : "$";

      const { data, error } = await supabase.functions.invoke(
        "send-overdue-reminder",
        {
          body: {
            clientName: invoice.client.name,
            clientEmail: invoice.client.email,
            invoiceNumber: invoice.invoice_number,
            dueDate: invoice.due_date,
            amount: invoice.total_amount,
            currencySymbol: currencySymbol,
          },
        }
      );

      if (error) {
        throw new Error(error.message || "Failed to send reminder");
      }

      toast({
        title: "Success",
        description: "Reminder email sent successfully",
      });
    } catch (error: any) {
      console.error("Error sending reminder:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reminder",
      });
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      const { error: itemsError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", invoiceId);

      if (itemsError) {
        console.error("Error deleting invoice items:", itemsError);
        throw itemsError;
      }

      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceId);

      if (error) {
        console.error("Error deleting invoice:", error);
        throw error;
      }

      setShowDeleteDialog(false);

      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });

      navigate("/invoices", { replace: true });
    } catch (error: any) {
      console.error("Failed to delete invoice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete invoice",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDeleteDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    if (!isDeleting) {
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
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
            <DropdownMenuItem onClick={handleSend}>
              <Send className="w-4 h-4 mr-2" />
              {isSending ? "Sending..." : "Send"}
            </DropdownMenuItem>
          )}

          {status === "pending" && (
            <DropdownMenuItem onClick={handleMarkAsPaid}>
              <Check className="w-4 h-4 mr-2" />
              {isMarkingAsPaid ? "Processing..." : "Mark as Paid"}
            </DropdownMenuItem>
          )}

          {status === "overdue" && (
            <>
              <DropdownMenuItem onClick={handleMarkAsPaid}>
                <Check className="w-4 h-4 mr-2" />
                {isMarkingAsPaid ? "Processing..." : "Mark as Paid"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSendReminder}
                disabled={isSendingReminder}
              >
                <Bell className="w-4 h-4 mr-2" />
                {isSendingReminder ? "Sending..." : "Send Reminder"}
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />

          {(status === "pending" ||
            status === "paid" ||
            status === "overdue") && (
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </DropdownMenuItem>
          )}

          {status === "draft" ? (
            <DropdownMenuItem onClick={handleEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleView}>
              <FileDown className="w-4 h-4 mr-2" />
              View
            </DropdownMenuItem>
          )}

          {status === "draft" && (
            <DropdownMenuItem onClick={handleOpenDeleteDialog}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDeleteDialog} onOpenChange={handleCloseDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDeleteDialog}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceActions;
