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
   
