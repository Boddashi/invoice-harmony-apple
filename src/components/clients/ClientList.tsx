import React, { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ArrowUpDown,
  ArrowUp,
} from "lucide-react";
import CustomCard from "../ui/CustomCard";
import AddClientModal from "./AddClientModal";
import ClientActions from "./ClientActions";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Client {
  id: string;
  type: string;
  name: string;
  email: string;
  phone: string | null;
  street?: string | null;
  number?: string | null;
  bus?: string | null;
  postcode?: string | null;
  city?: string | null;
  country?: string | null;
  vat_number?: string | null;
  vatNumber?: string | null;
  legal_entity_id?: number | null;
  invoices?: number;
  totalSpent?: number;
}

type SortField = "name" | "email" | "city" | "invoices" | "totalSpent";
type SortDirection = "asc" | "desc";

const ClientList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const { currencySymbol } = useCurrency();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const formatAmount = (amount: number | string) => {
    if (typeof amount === "string") {
      return amount;
    }
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  const fetchClients = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id);
      if (clientsError) {
        throw clientsError;
      }
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("client_id, total_amount")
        .eq("user_id", user.id);
      if (invoicesError) {
        throw invoicesError;
      }
      const clientInvoiceMap = new Map();
      invoicesData.forEach((invoice) => {
        const clientId = invoice.client_id;
        if (!clientInvoiceMap.has(clientId)) {
          clientInvoiceMap.set(clientId, {
            count: 0,
            total: 0,
          });
        }
        const clientData = clientInvoiceMap.get(clientId);
        clientData.count += 1;
        clientData.total += Number(invoice.total_amount);
        clientInvoiceMap.set(clientId, clientData);
      });
      const transformedData = clientsData.map((client) => {
        const invoiceData = clientInvoiceMap.get(client.id) || {
          count: 0,
          total: 0,
        };
        return {
          ...client,
          vatNumber: client.vat_number,
          invoices: invoiceData.count,
          totalSpent: invoiceData.total,
        };
      });
      setClients(transformedData);
    } catch (error: any) {
      console.error("Error fetching clients with invoice data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch clients.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user, toast]);

  const filteredClients = clients.filter((client) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      (client.phone && client.phone.toLowerCase().includes(query)) ||
      (client.city && client.city.toLowerCase().includes(query)) ||
      (client.country && client.country.toLowerCase().includes(query)) ||
      (client.vat_number && client.vat_number.toLowerCase().includes(query))
    );
  });

  const sortedClients = [...filteredClients].sort((a, b) => {
    if (sortField === "name" || sortField === "email") {
      const aValue = a[sortField]?.toLowerCase() || "";
      const bValue = b[sortField]?.toLowerCase() || "";

      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    } else if (sortField === "city") {
      const aValue = a.city?.toLowerCase() || "";
      const bValue = b.city?.toLowerCase() || "";

      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    } else if (sortField === "invoices" || sortField === "totalSpent") {
      const aValue = a[sortField] || 0;
      const bValue = b[sortField] || 0;

      if (sortDirection === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    }

    return 0;
  });

  useEffect(() => {
    setTotalPages(
      Math.max(1, Math.ceil(filteredClients.length / itemsPerPage))
    );
    if (currentPage > Math.ceil(filteredClients.length / itemsPerPage)) {
      setCurrentPage(1);
    }
  }, [filteredClients, itemsPerPage, currentPage]);

  const paginatedClients = sortedClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return (
        <ArrowUp
          size={16}
          className={cn(
            "ml-1 inline-block transition-transform",
            sortDirection === "desc" ? "transform rotate-180" : ""
          )}
        />
      );
    }
    return <ArrowUp size={16} className="ml-1 inline-block text-gray-400" />;
  };

  const handleAddClient = async (newClient: any) => {
    try {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to add clients.",
        });
        return;
      }
      const clientData = {
        user_id: user.id,
        type: newClient.type,
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone || null,
        street: newClient.street || null,
        number: newClient.number || null,
        bus: newClient.bus || null,
        postcode: newClient.postcode || null,
        city: newClient.city || null,
        country: newClient.country || null,
        vat_number: newClient.vatNumber || null,
        legal_entity_id: newClient.legal_entity_id || null,
      };
      const { data, error } = await supabase
        .from("clients")
        .insert(clientData)
        .select()
        .single();
      if (error) {
        throw error;
      }
      if (data) {
        const clientWithInvoiceData = {
          ...data,
          vatNumber: data.vat_number,
          invoices: 0,
          totalSpent: 0,
        };
        setClients([...clients, clientWithInvoiceData]);
      }
      toast({
        title: "Success",
        description: "Client added successfully.",
      });
    } catch (error: any) {
      console.error("Error adding client:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add client.",
      });
    }
  };

  const handleUpdateClient = async (updatedClient: any) => {
    try {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to update clients.",
        });
        return;
      }
      const clientData = {
        user_id: user.id,
        type: updatedClient.type,
        name: updatedClient.name,
        email: updatedClient.email,
        phone: updatedClient.phone || null,
        street: updatedClient.street || null,
        number: updatedClient.number || null,
        bus: updatedClient.bus || null,
        postcode: updatedClient.postcode || null,
        city: updatedClient.city || null,
        country: updatedClient.country || null,
        vat_number: updatedClient.vatNumber || null,
        legal_entity_id: updatedClient.legal_entity_id || null,
      };
      const { data, error } = await supabase
        .from("clients")
        .update(clientData)
        .eq("id", updatedClient.id)
        .select()
        .single();
      if (error) {
        throw error;
      }
      if (data) {
        const existingClient = clients.find((c) => c.id === updatedClient.id);
        const clientWithInvoiceData = {
          ...data,
          vatNumber: data.vat_number,
          invoices: existingClient?.invoices || 0,
          totalSpent: existingClient?.totalSpent || 0,
        };
        setClients(
          clients.map((client) =>
            client.id === updatedClient.id ? clientWithInvoiceData : client
          )
        );
      }
      toast({
        title: "Success",
        description: "Client updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating client:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update client.",
      });
    }
  };

  const handleEditClient = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setClientToEdit(client);
      setIsModalOpen(true);
    }
  };

  const handleOpenModal = () => {
    setClientToEdit(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setClientToEdit(null);
    setIsModalOpen(false);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const generatePaginationItems = () => {
    if (totalPages <= 5) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, i) => i + 1
      );
    }
    const items = new Set([1, totalPages, currentPage]);
    if (currentPage > 1) items.add(currentPage - 1);
    if (currentPage < totalPages) items.add(currentPage + 1);
    return Array.from(items).sort((a, b) => a - b);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl font-semibold">Your Clients</h2>
        <Button
          onClick={handleOpenModal}
          className="apple-button dark:hover:!bg-neon-purple flex items-center gap-2 w-full sm:w-auto rounded-full"
        >
          <Plus size={18} />
          <span>Add Client</span>
        </Button>
      </div>

      <div className="relative w-full">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background/60 dark:bg-secondary/20 dark:border-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <CustomCard padding="none">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery.trim()
                ? "No clients match your search. Try a different search term."
                : "No clients found. Add your first client to get started."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      Name {renderSortIcon("name")}
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("city")}
                    >
                      Address {renderSortIcon("city")}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer"
                      onClick={() => handleSort("invoices")}
                    >
                      Invoices {renderSortIcon("invoices")}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer"
                      onClick={() => handleSort("totalSpent")}
                    >
                      Total Spent {renderSortIcon("totalSpent")}
                    </TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{client.name}</span>
                          {client.type === "business" && client.vat_number && (
                            <span className="text-xs text-muted-foreground mt-1">
                              VAT: {client.vat_number}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-muted-foreground" />
                            <span className="text-sm">{client.email}</span>
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-2 mt-1">
                              <Phone
                                size={14}
                                className="text-muted-foreground"
                              />
                              <span className="text-sm">{client.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          {client.street && (
                            <span>
                              {client.street} {client.number} {client.bus}
                            </span>
                          )}
                          {client.postcode && client.city && (
                            <span>
                              {client.postcode} {client.city}
                            </span>
                          )}
                          {client.country && (
                            <span className="text-muted-foreground">
                              {client.country}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {client.invoices}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {client.totalSpent !== undefined
                          ? formatAmount(client.totalSpent)
                          : "$0.00"}
                      </TableCell>
                      <TableCell>
                        <ClientActions
                          clientId={client.id}
                          onEditClient={handleEditClient}
                          onClientDeleted={fetchClients}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="lg:hidden divide-y divide-border">
              {paginatedClients.map((client) => (
                <div key={client.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{client.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Mail size={12} />
                        {client.email}
                      </p>
                      {client.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone size={12} />
                          {client.phone}
                        </p>
                      )}
                    </div>
                    <ClientActions
                      clientId={client.id}
                      onEditClient={handleEditClient}
                      onClientDeleted={fetchClients}
                    />
                  </div>

                  {client.street && (
                    <div className="text-sm mt-2">
                      <div>
                        {client.street} {client.number} {client.bus}
                      </div>
                      {client.postcode && client.city && (
                        <div>
                          {client.postcode} {client.city}
                        </div>
                      )}
                      {client.country && (
                        <div className="text-muted-foreground">
                          {client.country}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Invoices</p>
                      <p className="font-medium">{client.invoices || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total Spent
                      </p>
                      <p className="font-medium">
                        {client.totalSpent !== undefined
                          ? formatAmount(client.totalSpent)
                          : "$0.00"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-border">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="flex items-center gap-2 text-sm w-full sm:w-auto">
                    <span className="text-muted-foreground whitespace-nowrap">
                      Rows per page:
                    </span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={handleItemsPerPageChange}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectGroup>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <button
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                          className={cn(
                            "flex items-center justify-center h-9 w-9 rounded-md text-sm",
                            currentPage === 1
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-secondary"
                          )}
                          aria-label="Go to first page"
                        >
                          <ChevronsLeft size={16} />
                        </button>
                      </PaginationItem>

                      <PaginationItem>
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md text-sm",
                            currentPage === 1
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-secondary"
                          )}
                        >
                          <ChevronLeft size={16} />
                          <span className="hidden sm:inline">Previous</span>
                        </button>
                      </PaginationItem>

                      {generatePaginationItems().map((page, index, array) => {
                        const showEllipsisBefore =
                          index > 0 && page > array[index - 1] + 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && (
                              <PaginationItem className="hidden sm:inline-block">
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <button
                                onClick={() => handlePageChange(page)}
                                className={cn(
                                  "flex items-center justify-center h-9 w-9 rounded-md text-sm",
                                  currentPage === page
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-secondary"
                                )}
                              >
                                {page}
                              </button>
                            </PaginationItem>
                          </React.Fragment>
                        );
                      })}

                      <PaginationItem>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md text-sm",
                            currentPage === totalPages
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-secondary"
                          )}
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight size={16} />
                        </button>
                      </PaginationItem>

                      <PaginationItem>
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                          className={cn(
                            "flex items-center justify-center h-9 w-9 rounded-md text-sm",
                            currentPage === totalPages
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-secondary"
                          )}
                          aria-label="Go to last page"
                        >
                          <ChevronsRight size={16} />
                        </button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            )}
          </>
        )}
      </CustomCard>

      <AddClientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddClient={handleAddClient}
        onUpdateClient={handleUpdateClient}
        clientToEdit={clientToEdit}
      />
    </div>
  );
};

export default ClientList;
