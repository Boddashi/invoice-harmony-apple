
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Pencil, Trash2, Eye, Download } from 'lucide-react';
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
import { Button } from '@/components/ui/button';

interface InvoiceActionsProps {
  invoiceId: string;
  status: string;
}

const InvoiceActions = ({ invoiceId, status }: InvoiceActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleEdit = () => {
    navigate(`/invoices/edit/${invoiceId}`);
  };

  const handleView = () => {
    navigate(`/invoices/${invoiceId}`);
  };

  const handleDownload = () => {
    // PDF download functionality would go here
    toast({
      title: "Invoice Download",
      description: "Download functionality will be implemented soon."
    });
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    
    try {
      // First, delete related invoice items
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

      if (itemsError) {
        console.error('Error deleting invoice items:', itemsError);
        throw itemsError;
      }

      // Then delete the invoice
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
      
      // Use replace to prevent back navigation to a deleted invoice
      // Important: navigate AFTER dialog is closed and state is reset
      setTimeout(() => {
        navigate('/invoices', { replace: true });
      }, 100);
      
    } catch (error: any) {
      console.error('Failed to delete invoice:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete invoice"
      });
    } finally {
      // Always reset state and close dialog, regardless of success or failure
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleOpenDeleteDialog = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setShowDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
  };

  // For pending, paid, and overdue invoices - show View and Download buttons
  if (status === 'pending' || status === 'paid' || status === 'overdue') {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={(e) => {
            e.stopPropagation();
            handleView();
          }}
          title="View Invoice"
        >
          <Eye size={16} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          title="Download Invoice"
        >
          <Download size={16} />
        </Button>
      </div>
    );
  }

  // For draft invoices - show dropdown with Edit and Delete options
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
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
