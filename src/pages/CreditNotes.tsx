
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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-semibold">Credit Notes</h1>
          <button
            onClick={() => navigate("/creditnotes/new")}
            className="apple-button mt-2 md:mt-0"
          >
            <Plus size={20} />
            New Credit Note
          </button>
        </div>

        <CustomCard className="mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full lg:w-auto">
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Search credit notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg w-full"
                />
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
              </div>

              <Select
                value={filter}
                onValueChange={(value) => setFilter(value as CreditNoteStatus)}
              >
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 mt-2 lg:mt-0 w-full lg:w-auto">
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => setItemsPerPage(parseInt(value))}
              >
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="Show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : paginatedCreditNotes.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-lg text-gray-500">No credit notes found</p>
              {filter !== "all" && (
                <button
                  onClick={() => setFilter("all")}
                  className="mt-2 text-apple-blue hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("invoice_number")}
                      >
                        Credit Note #
                        {renderSortIcon("invoice_number")}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("client.name")}
                      >
                        Client
                        {renderSortIcon("client.name")}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("issue_date")}
                      >
                        Issue Date
                        {renderSortIcon("issue_date")}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("total_amount")}
                      >
                        Amount
                        {renderSortIcon("total_amount")}
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCreditNotes.map((creditNote) => (
                      <TableRow
                        key={creditNote.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          navigate(`/creditnotes/edit/${creditNote.id}`)
                        }
                      >
                        <TableCell className="font-medium">
                          {creditNote.invoice_number}
                        </TableCell>
                        <TableCell>
                          {creditNote.client?.name || "Unknown Client"}
                        </TableCell>
                        <TableCell>
                          {formatDate(creditNote.issue_date)}
                        </TableCell>
                        <TableCell>
                          {formatAmount(creditNote.total_amount)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                              creditNote.status
                            )}`}
                          >
                            {getStatusLabel(creditNote.status)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <CreditNoteActions
                            creditNoteId={creditNote.id}
                            status={creditNote.status}
                            onStatusChange={handleCreditNoteStatusChange}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        className={cn(
                          currentPage === 1 && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .slice(
                        Math.max(
                          0,
                          currentPage - 2 - Math.max(0, currentPage + 1 - totalPages)
                        ),
                        Math.min(
                          totalPages,
                          currentPage + 1 + Math.max(0, 3 - currentPage)
                        )
                      )
                      .map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        className={cn(
                          currentPage === totalPages &&
                            "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CustomCard>
      </div>
    </MainLayout>
  );
};

export default CreditNotes;
