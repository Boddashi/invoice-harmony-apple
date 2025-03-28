
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  FileMinus,
  FileText,
} from "lucide-react";
import CustomCard from "../ui/CustomCard";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import CreditNoteActions from "../creditnotes/CreditNoteActions";

type CreditNoteStatus = "applied" | "pending" | "draft";

interface CreditNote {
  id: string;
  client_id: string;
  credit_note_number: string;
  issue_date: string;
  status: CreditNoteStatus;
  total_amount: number;
  client?: {
    name: string;
  };
}

interface CreditNoteListProps {
  onStatusChange?: () => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "applied":
      return {
        label: "Applied",
        color: "bg-apple-green/10 text-apple-green border-apple-green/20",
        icon: CheckCircle,
      };
    case "pending":
      return {
        label: "Pending",
        color: "bg-apple-orange/10 text-apple-orange border-apple-orange/20",
        icon: Clock,
      };
    case "draft":
      return {
        label: "Draft",
        color: "bg-gray-100 text-gray-600 border-gray-200",
        icon: FileText,
      };
    default:
      // Fallback for unknown status
      return {
        label: "Unknown",
        color: "bg-gray-100 text-gray-600 border-gray-200",
        icon: FileText,
      };
  }
};

const CreditNoteList: React.FC<CreditNoteListProps> = ({ onStatusChange }) => {
  const { currencySymbol } = useCurrency();
  const [recentCreditNotes, setRecentCreditNotes] = useState<CreditNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: isMobile ? "short" : "long",
      day: "numeric",
    });
  };

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
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      const typedData =
        data?.map((creditNote) => ({
          ...creditNote,
          status: creditNote.status as CreditNoteStatus,
        })) || [];

      setRecentCreditNotes(typedData);
    } catch (error: any) {
      console.error("Error fetching recent credit notes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch recent credit notes.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditNotes();
  }, [user, toast]);

  const handleStatusChange = () => {
    fetchCreditNotes();
    if (onStatusChange) {
      onStatusChange();
    }
  };

  return (
    <CustomCard className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recent Credit Notes</h2>
        <Link
          to="/creditnotes"
          className="text-apple-blue dark:text-apple-purple flex items-center text-sm hover:underline"
        >
          View all{" "}
          <ArrowRight size={16} className="ml-1 dark:text-apple-purple" />
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">Loading credit notes...</p>
        </div>
      ) : recentCreditNotes.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">
            No credit notes found. Create your first credit note to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentCreditNotes.map((creditNote) => {
            const status = getStatusConfig(creditNote.status);
            const StatusIcon = status.icon;

            return (
              <div
                key={creditNote.id}
                className="block rounded-lg hover:bg-secondary/50 transition-colors"
              >
                {/* Desktop Layout */}
                <div className="hidden md:flex items-center justify-between p-3">
                  <Link
                    to={`/creditnotes/view/${creditNote.id}`}
                    className="flex items-center gap-4 flex-grow"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        status.color
                      )}
                    >
                      <StatusIcon size={18} />
                    </div>

                    <div>
                      <h3 className="font-medium">
                        {creditNote.client?.name || "Unknown Client"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {creditNote.credit_note_number} •{" "}
                        {formatDate(creditNote.issue_date)}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatAmount(creditNote.total_amount)}
                      </p>
                    </div>

                    <div
                      className={cn(
                        "px-3 py-1 text-xs font-medium border rounded-full",
                        status.color
                      )}
                    >
                      {status.label}
                    </div>

                    <CreditNoteActions
                      creditNoteId={creditNote.id}
                      status={creditNote.status}
                      onStatusChange={handleStatusChange}
                    />
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden p-3 relative">
                  <div className="flex justify-between items-start">
                    <Link
                      to={`/creditnotes/view/${creditNote.id}`}
                      className="flex-grow"
                    >
                      {/* Top row: icon, client name, and status badge */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              status.color
                            )}
                          >
                            <StatusIcon size={16} />
                          </div>

                          <h3 className="font-medium text-sm truncate max-w-[120px]">
                            {creditNote.client?.name || "Unknown Client"}
                          </h3>
                        </div>

                        <div
                          className={cn(
                            "px-2 py-0.5 text-xs font-medium border rounded-full",
                            status.color
                          )}
                        >
                          {status.label}
                        </div>
                      </div>

                      {/* Middle row: credit note number, amount */}
                      <div className="flex justify-between mb-1">
                        <p className="text-xs text-muted-foreground">
                          {creditNote.credit_note_number}
                        </p>
                        <p className="font-semibold text-sm">
                          {formatAmount(creditNote.total_amount)}
                        </p>
                      </div>

                      {/* Bottom row: dates */}
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          Issued {formatDate(creditNote.issue_date)}
                        </p>
                      </div>
                    </Link>

                    <div className="ml-2">
                      <CreditNoteActions
                        creditNoteId={creditNote.id}
                        status={creditNote.status}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CustomCard>
  );
};

export default CreditNoteList;
