
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import CustomCard from "../components/ui/CustomCard";
import {
  Check,
  ChevronDown,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import CreditNoteActions from "@/components/creditnotes/CreditNoteActions";
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

type CreditNoteStatus = "all" | "draft" | "pending" | "paid";
type CreditNoteDBStatus = "draft" | "pending" | "paid";
type SortField =
  | "invoice_number"
  | "client.name"
  | "issue_date"
  | "total_amount";
type SortOrder = "asc" | "desc";

interface CreditNote {
  id: string;
  client_id: string;
  invoice_number: string;
  issue_date: string;
  status: CreditNoteDBStatus;
  amount: number;
  tax_rate?: number;
  tax_amount?: number;
  total_amount: number;
  notes?: string;
  client?: {
    name: string;
  };
}

const CreditNotes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { currencySymbol } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const queryParams = new URLSearchParams(location.search);
  const filterParam = queryParams.get("filter") as CreditNoteStatus | null;
  const [filter, setFilter] = useState<CreditNoteStatus>(filterParam || "all");

  const [sortBy, setSortBy] = useState<SortField>("invoice_number");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  useEffect(() => {
    if (filter === "all") {
      navigate("/creditnotes", { replace: true });
    } else {
      navigate(`/creditnotes?filter=${filter}`, { replace: true });
    }
  }, [filter, navigate]);

  useEffect(() => {
    const filterParam = queryParams.get("filter") as CreditNoteStatus | null;
    if (
      filterParam &&
      ["all", "draft", "pending", "paid"].includes(filterParam)
    ) {
      setFilter(filterParam);
    }
  }, [location.search]);

  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCreditNoteStatusChange = () => {
    const fetchCreditNotes = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("credit_notes")
          .select(
            `
            *,
            client:clients(name)
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        const typedData =
          data?.map((creditNote) => ({
            ...creditNote,
            status: creditNote.status as CreditNoteDBStatus,
          })) || [];

        setCreditNotes(typedData);
      } catch (error: any) {
        console.error("Error fetching credit notes:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch credit notes.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreditNotes();
  };

  useEffect(() => {
    handleCreditNoteStatusChange();
  }, [user, toast]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getSortedCreditNotes = (creditNotes: CreditNote[]) => {
    return [...creditNotes].sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;

      switch (sortBy) {
        case "invoice_number":
          return multiplier * a.invoice_number.localeCompare(b.invoice_number);
        case "client.name":
          return (
            multiplier *
            (a.client?.name || "").localeCompare(b.client?.name || "")
          );
        case "issue_date":
          return (
            multiplier *
            (new Date(a.issue_date).getTime() -
              new Date(b.issue_date).getTime())
          );
        case "total_amount":
          return multiplier * (a.total_amount - b.total_amount);
        default:
          return 0;
      }
    });
  };

  const renderSortIcon = (field: SortField) => {
    if (sortBy === field) {
      return (
        <ArrowUp
          size={16}
          className={cn(
            "ml-1 inline-block transition-transform",
            sortOrder === "desc" ? "transform rotate-180" : ""
          )}
        />
      );
    }
    return <ArrowUp size={16} className="ml-1 inline-block text-gray-400" />;
  };

  const sortedAndFilteredCreditNotes = getSortedCreditNotes(
    creditNotes
      .filter((creditNote) => filter === "all" || creditNote.status === filter)
      .filter((creditNote) => {
        if (!searchQuery.trim()) return true;

        const query = searchQuery.toLowerCase();
        return (
          creditNote.invoice_number.toLowerCase().includes(query) ||
          (creditNote.client?.name &&
            creditNote.client.name.toLowerCase().includes(query)) ||
          formatDate(creditNote.issue_date).toLowerCase().includes(query) ||
          creditNote.total_amount.toString().includes(query)
        );
      })
  );

  useEffect(() => {
    setTotalPages(
      Math.max(1, Math.ceil(sortedAndFilteredCreditNotes.length / itemsPerPage))
    );

    if (
      currentPage > Math.ceil(sortedAndFilteredCreditNotes.length / itemsPerPage)
    ) {
      setCurrentPage(1);
    }
  }, [sortedAndFilteredCreditNotes, itemsPerPage, currentPage]);

  const paginatedCreditNotes = sortedAndFilteredCreditNotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: CreditNote["status"]) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-600 border-gray-200";
      case "pending":
        return "bg-apple-orange/10 text-apple-orange border-apple-orange/20";
      case "paid":
        return "bg-apple-green/10 text-apple-green border-apple-green/20";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getStatusLabel = (status: CreditNote["status"]) => {
    switch (status) {
      case "draft":
        return "Draft";
      case "pending":
        return "Pending";
      case "paid":
        return "Paid";
      default:
        return "Unknown";
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const generatePaginationItems = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items = new Set([1, totalPages, currentPage]);

    if (currentPage > 1) items.add(currentPage - 1);
    if (currentPage < totalPages) items.add(currentPage + 1);

    return Array.from(items).sort((a, b) => a - b);
  };

  return (
    <MainLayout>
      <div className="w-full max-w-6xl mx-auto px-2 md:px-0 space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-in">
          <h2 className="text-xl font-semibold">Your Credit Notes</h2>
          <button
            className="apple-button flex items-center gap-2 w-full sm:w-auto rounded-full"
            onClick={() => navigate("/creditnotes/new")}
          >
            <Plus size={18} />
            <span>New Credit Note</span>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder="Search credit notes..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background/60 dark:bg-secondary/20 dark:border-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex overflow-x-auto pb-1 -mx-2 px-4 py-4 xmd:mx-2 xmd:px-4 xmd:py-4 scrollbar-none">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                  filter === "all"
                    ? "apple-button text-white hover:!shadow-none"
                    : "hover:bg-secondary"
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilter("draft")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                  filter === "draft"
                    ? "apple-button text-white hover:!shadow-none"
                    : "hover:bg-secondary"
                )}
              >
                Draft
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                  filter === "pending"
                    ? "apple-button text-white hover:!shadow-none"
                    : "hover:bg-secondary"
                )}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter("paid")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                  filter === "paid"
                    ? "apple-button text-white hover:!shadow-none"
                    : "hover:bg-secondary"
                )}
              >
                Paid
              </button>
            </div>
          </div>
        </div>

        <CustomCard
          padding="none"
          className="animate-fade-in w-full overflow-hidden"
        >
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading credit notes...</p>
            </div>
          ) : sortedAndFilteredCreditNotes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery.trim()
                  ? "No credit notes match your search. Try a different search term."
                  : "No credit notes found. Create your first credit note to get started."}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden xmd:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("invoice_number")}
                      >
                        Credit Note # {renderSortIcon("invoice_number")}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("client.name")}
                      >
                        Client {renderSortIcon("client.name")}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("issue_date")}
                      >
                        Issue Date {renderSortIcon("issue_date")}
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer"
                        onClick={() => handleSort("total_amount")}
                      >
                        Amount {renderSortIcon("total_amount")}
                      </TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCreditNotes.map((creditNote) => (
                      <TableRow
                        key={creditNote.id}
                        onClick={() => navigate(`/creditnotes/edit/${creditNote.id}`)}
                        className="cursor-pointer"
                      >
                        <TableCell className="font-medium">
                          {creditNote.invoice_number}
                        </TableCell>
                        <TableCell>
                          {creditNote.client
                            ? creditNote.client.name
                            : "Unknown Client"}
                        </TableCell>
                        <TableCell>{formatDate(creditNote.issue_date)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatAmount(creditNote.total_amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <span
                              className={cn(
                                "px-3 py-1 text-xs font-medium border rounded-full",
                                getStatusColor(creditNote.status)
                              )}
                            >
                              {getStatusLabel(creditNote.status)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            className="flex justify-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <CreditNoteActions
                              creditNoteId={creditNote.id}
                              status={creditNote.status}
                              onStatusChange={handleCreditNoteStatusChange}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="xmd:hidden divide-y divide-border">
                {paginatedCreditNotes.map((creditNote) => (
                  <div
                    key={creditNote.id}
                    className="p-4 hover:bg-secondary/30 transition-colors active:bg-secondary/50"
                    onClick={() => navigate(`/creditnotes/edit/${creditNote.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="mr-2 flex-1">
                        <h3 className="font-medium truncate">
                          {creditNote.invoice_number}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {creditNote.client?.name || "Unknown Client"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 text-xs font-medium border rounded-full shrink-0",
                          getStatusColor(creditNote.status)
                        )}
                      >
                        {getStatusLabel(creditNote.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-1 text-sm mb-3">
                      <div className="text-muted-foreground">Issue Date:</div>
                      <div className="text-right truncate">
                        {formatDate(creditNote.issue_date)}
                      </div>

                      <div className="text-muted-foreground">Amount:</div>
                      <div className="text-right font-medium">
                        {formatAmount(creditNote.total_amount)}
                      </div>
                    </div>

                    <div
                      className="flex justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CreditNoteActions
                        creditNoteId={creditNote.id}
                        status={creditNote.status}
                        onStatusChange={handleCreditNoteStatusChange}
                      />
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
      </div>
    </MainLayout>
  );
};

export default CreditNotes;
