
import React from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Edit, Trash, Check, Clock, FileDown, Mail } from "lucide-react";
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
          <DropdownMenuItem onClick={(e) => handleStatusChange("pending", e)}>
            <Clock className="w-4 h-4 mr-2" />
            Mark as Pending
          </DropdownMenuItem>
        )}

        {status === "pending" && (
          <DropdownMenuItem onClick={(e) => handleStatusChange("paid", e)}>
            <Check className="w-4 h-4 mr-2" />
            Mark as Paid
          </DropdownMenuItem>
        )}

        {status === "paid" && (
          <DropdownMenuItem onClick={(e) => handleStatusChange("pending", e)}>
            <Clock className="w-4 h-4 mr-2" />
            Mark as Pending
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {status === "draft" && (
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={handleDelete}>
          <Trash className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CreditNoteActions;
