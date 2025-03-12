
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Pencil, Trash2, Download, Send } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateInvoicePDF, saveInvoicePDF } from '@/utils/pdfGenerator';

interface InvoiceActionsProps {
  invoiceId: string;
  status: string;
}

const InvoiceActions = ({ invoiceId, status }: InvoiceActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);

  const handleEdit = () => {
    navigate(`/invoices/edit/${invoiceId}`);
  };

  const handleView = () => {
    navigate(`/invoices/${invoiceId}`);
  };

  const handleDownload = async () => {
    try {
      if (status === 'draft') {
        toast({
          title: "Info",
          description: "Draft invoices don't have PDF versions. Send the invoice first to generate a PDF."
        });
        return;
      }
      
      const { data } = supabase.storage
        .from('invoices')
        .getPublicUrl(`${invoiceId}/invoice.pdf`);
      
      if (data && data.publicUrl) {
        const link = document.createElement('a');
        link.href = data.publicUrl;
        link.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "PDF not found. Please try regenerating the invoice."
        });
      }
    } catch (error: any) {
      console.error('Error downloading invoice PDF:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to download PDF."
      });
    }
  };

  const handleSend = async () => {
    if (isSending) return;
    
    setIsSending(true);
    try {
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'pending' })
        .eq('id', invoiceId);
      
      if (updateError) throw updateError;
      
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', invoiceId)
        .single();
      
      if (invoiceError) throw invoiceError;
      
      const { data: invoiceItems, error: itemsError } = await supabase
        .from('invoice_items')
        .select(`
          *,
          items:item_id(*)
        `)
        .eq('invoice_id', invoiceId);
      
      if (itemsError) throw itemsError;
      
      const { data: { user } } = await supabase.auth.getUser();

      if (!invoice || !invoiceItems || !user) {
        throw new Error("Could not retrieve all required data");
      }
      
      const itemsForPDF = invoiceItems.map(item => {
        const itemData = item.items;
        return {
          description: itemData.title,
          quantity: item.quantity,
          unit_price: item.total_amount / item.quantity,
          amount: item.total_amount,
          vat_rate: itemData.vat
        };
      });
      
      const subTotal = invoiceItems.reduce((sum, item) => sum + Number(item.total_amount), 0);
      const taxAmount = invoice.tax_amount || 0;
      
      const { data: settings } = await supabase
        .from('company_settings')
        .select('default_currency')
        .eq('user_id', user.id)
        .single();
      
      const currencySymbol = settings?.default_currency === 'USD' ? '$' : 
                            settings?.default_currency === 'EUR' ? '€' : 
                            settings?.default_currency === 'GBP' ? '£' : '$';
      
      const pdfBase64 = await generateInvoicePDF({
        id: invoiceId,
        invoice_number: invoice.invoice_number,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        client_name: invoice.client?.name || 'Client',
        user_email: user.email || '',
        items: itemsForPDF,
        subTotal,
        taxAmount,
        total: Number(invoice.total_amount),
        notes: invoice.notes,
        currencySymbol
      });
      
      toast({
        title: "Success",
        description: "Invoice sent successfully and PDF generated"
      });
      
      // Replace window.location.reload() with navigate to prevent full page reload
      navigate('/invoices', { replace: true });
      
    } catch (error: any) {
      console.error('Error sending invoice:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send invoice"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    
    try {
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

      if (itemsError) {
        console.error('Error deleting invoice items:', itemsError);
        throw itemsError;
      }

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) {
        console.error('Error deleting invoice:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Invoice deleted successfully"
      });
      
      // Use navigate instead of setTimeout and reload
      navigate('/invoices', { replace: true });
      
    } catch (error: any) {
      console.error('Failed to delete invoice:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete invoice"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleOpenDeleteDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
  };

  if (status !== 'draft') {
    return (
      <div className="flex items-center gap-1">
        <button 
          className="p-1.5 rounded-full hover:bg-secondary transition-colors" 
          title="Download"
          onClick={handleDownload}
        >
          <Download size={16} />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {status === 'draft' ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-full hover:bg-secondary transition-colors">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={handleSend}
                disabled={isSending}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSending ? 'Sending...' : 'Send'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleOpenDeleteDialog} 
                className="text-destructive"
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button 
            className="p-1.5 rounded-full hover:bg-secondary transition-colors" 
            title="Download"
            onClick={handleDownload}
          >
            <Download size={16} />
          </button>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={handleCloseDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InvoiceActions;
