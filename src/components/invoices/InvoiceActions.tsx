import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Pencil, Trash2, Download, Eye } from 'lucide-react';
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
    toast({
      title: "Info",
      description: "Download feature is not implemented yet."
    });
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
          title="View"
          onClick={handleView}
        >
          <Eye size={16} />
        </button>
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
