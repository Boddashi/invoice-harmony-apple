
import React from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditItemModal from "./EditItemModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Item {
  id: string;
  title: string;
  price: number;
  vat: string;
}

interface ItemActionsProps {
  item: Item;
  onItemUpdated: () => void;
  onDeleteItem: (id: string) => void;
}

const ItemActions: React.FC<ItemActionsProps> = ({
  item,
  onItemUpdated,
  onDeleteItem,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 rounded-full hover:bg-secondary transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <EditItemModal
            item={item}
            onItemUpdated={onItemUpdated}
            trigger={
              <button className="flex w-full items-center px-2 py-1.5 text-sm cursor-default hover:bg-accent hover:text-accent-foreground">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </button>
            }
          />
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onDeleteItem(item.id)} 
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ItemActions;
