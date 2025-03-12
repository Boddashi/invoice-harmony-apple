
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Pencil, Trash2, Download, Send, Check, Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface InvoiceActionsProps {
  invoiceId: string;
  status: string;
  onStatusChange?: () => void;
}

const InvoiceActions = ({ invoiceId, status, onStatusChange }: InvoiceActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [isMarkingAsPaid, setIsMarkingAsPaid] = React.useState(false);

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

  const handleSend = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

      if (onStatusChange) {
        onStatusChange();
      }
      
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

  const handleMarkAsPaid = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isMarkingAsPaid) return;
    
    setIsMarkingAsPaid(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Invoice marked as paid"
      });
      
      if (onStatusChange) {
        onStatusChange();
      }
      
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to mark invoice as paid"
      });
    } finally {
      setIsMarkingAsPaid(false);
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

      setShowDeleteDialog(false);

      toast({
        title: "Success",
        description: "Invoice deleted successfully"
      });
      
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

  const handleSendReminder = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', invoiceId)
        .single();
      
      if (invoiceError) throw invoiceError;
      
      const response = await fetch('/functions/v1/send-overdue-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          clientName: invoice.client.name,
          clientEmail: invoice.client.email,
          invoiceNumber: invoice.invoice_number,
          dueDate: invoice.due_date,
          amount: invoice.total_amount,
          currencySymbol: '$'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reminder');
      }

      toast({
        title: "Success",
        description: "Reminder email sent successfully"
      });
      
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reminder"
      });
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="p-1.5 rounded-full hover:bg-secondary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {status === 'draft' && (
              <>
                <DropdownMenuItem 
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex items-center text-white bg-blue-500 hover:bg-blue-600 rounded-md my-1 cursor-pointer"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSending ? 'Sending...' : 'Send'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleEdit}
                  className="flex items-center text-white bg-amber-500 hover:bg-amber-600 rounded-md my-1 cursor-pointer"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleOpenDeleteDialog} 
                  className="flex items-center text-white bg-red-500 hover:bg-red-600 rounded-md my-1 cursor-pointer"
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
            
            {status === 'pending' && (
              <>
                <DropdownMenuItem 
                  onClick={handleMarkAsPaid}
                  disabled={isMarkingAsPaid}
                  className="flex items-center text-white bg-green-500 hover:bg-green-600 rounded-md my-1 cursor-pointer"
                >
                  <Check className="mr-2 h-4 w-4" />
                  {isMarkingAsPaid ? 'Processing...' : 'Mark as Paid'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDownload}
                  className="flex items-center text-white bg-purple-500 hover:bg-purple-600 rounded-md my-1 cursor-pointer"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
              </>
            )}
            
            {status === 'paid' && (
              <DropdownMenuItem 
                onClick={handleDownload}
                className="flex items-center text-white bg-purple-500 hover:bg-purple-600 rounded-md my-1 cursor-pointer"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
            )}
            
            {status === 'overdue' && (
              <>
                <DropdownMenuItem 
                  onClick={handleSendReminder}
                  className="flex items-center text-white bg-orange-500 hover:bg-orange-600 rounded-md my-1 cursor-pointer"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Send Reminder
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDownload}
                  className="flex items-center text-white bg-purple-500 hover:bg-purple-600 rounded-md my-1 cursor-pointer"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog 
        open={showDeleteDialog} 
        onOpenChange={handleCloseDeleteDialog}
        modal={true}
      >
        <DialogContent className="sm:max-w-[425px] z-50">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
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
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceActions;
