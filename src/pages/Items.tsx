import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Package,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ArrowUpDown,
  Euro,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import AddItemModal from "@/components/items/AddItemModal";
import EditItemModal from "@/components/items/EditItemModal";
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
import CustomCard from "@/components/ui/CustomCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Item {
  id: string;
  title: string;
  price: number;
  vat: string;
  created_at: string;
}

const Items = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"title" | "price" | "vat">(
    "title"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { currencySymbol } = useCurrency();

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });
      if (error) {
        throw error;
      }
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id);
      if (error) throw error;
      setItems(items.filter((item) => item.id !== id));
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      currencyDisplay: "code",
    })
      .format(amount)
      .replace("EUR", "")
      .trim();
  };

  const handleSort = (field: "title" | "price" | "vat") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getFilteredItems = () => {
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.price.toString().includes(searchQuery)
    );
  };

  const getSortedItems = () => {
    return [...getFilteredItems()].sort((a, b) => {
      if (sortField === "title") {
        return sortDirection === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else if (sortField === "price") {
        return sortDirection === "asc" ? a.price - b.price : b.price - a.price;
      } else {
        return sortDirection === "asc"
          ? a.vat.localeCompare(b.vat)
          : b.vat.localeCompare(a.vat);
      }
    });
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Items</h1>
          <CustomCard>
            <p className="text-center py-4">
              Please log in to view and manage your items.
            </p>
          </CustomCard>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Items</h1>
            <p className="text-muted-foreground">
              Manage your inventory and products
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AddItemModal
              onItemAdded={fetchItems}
              trigger={
                <Button
                  variant="apple"
                  className="apple-button dark:hover:!bg-neon-purple flex items-center gap-2 w-full sm:w-auto rounded-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              }
            />
          </div>
        </div>

        <div className="relative w-full">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search items..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background/60 dark:bg-secondary/20 dark:border-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30 transition-colors"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        <CustomCard className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-apple-blue" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center p-12 rounded-lg">
              <div className="flex flex-col items-center text-center">
                <Package size={48} className="mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">No items yet</h2>
                <p className="text-muted-foreground mb-4">
                  You haven't added any items to your inventory yet.
                </p>
                <AddItemModal
                  trigger={
                    <Button variant="apple">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Item
                    </Button>
                  }
                  onItemAdded={fetchItems}
                />
              </div>
            </div>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="w-[250px] cursor-pointer"
                      onClick={() => handleSort("title")}
                    >
                      <div className="flex items-center">
                        Item Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer"
                      onClick={() => handleSort("price")}
                    >
                      <div className="flex items-center justify-end">
                        Price
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("vat")}
                    >
                      <div className="flex items-center">
                        VAT Rate
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSortedItems().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6">
                        <p>No items found matching your search.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    getSortedItems().map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.title}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Euro className="h-4 w-4 text-muted-foreground" />
                            <span>{formatCurrency(item.price)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="ghost"
                            className="text-base font-normal px-0"
                          >
                            {item.vat}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <EditItemModal
                              item={item}
                              onItemUpdated={fetchItems}
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Item
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "
                                    {item.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CustomCard>
      </div>
    </MainLayout>
  );
};

export default Items;
