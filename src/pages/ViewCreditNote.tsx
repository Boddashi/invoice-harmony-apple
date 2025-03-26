
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { ArrowLeft, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import CreditNoteBasicInfo from "@/components/creditnotes/CreditNoteBasicInfo";
import CreditNoteFrom from "@/components/creditnotes/CreditNoteFrom";
import CreditNoteItems from "@/components/creditnotes/CreditNoteItems";
import CreditNoteNotes from "@/components/creditnotes/CreditNoteNotes";
import CreditNoteSummary from "@/components/creditnotes/CreditNoteSummary";

interface CreditNoteItem {
  credit_note_id: string;
  item_id: string;
  quantity: number;
  total_amount: number;
  item: {
    id: string;
    title: string;
    price: number;
    vat: string;
  };
}

interface FormattedItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  vat_rate: string;
}

interface CreditNoteData {
  id: string;
  credit_note_number: string;
  client_id: string;
  issue_date: string;
  status: string;
  notes?: string;
  amount: number;
  tax_rate?: number;
  tax_amount?: number;
  total_amount: number;
  client?: {
    name: string;
    email: string;
    street?: string;
    number?: string;
    bus?: string;
    city?: string;
    postcode?: string;
    country?: string;
    vat_number?: string;
    phone?: string;
  };
  items?: CreditNoteItem[];
}

interface VatGroup {
  rate: string;
  value: number;
  amount: number;
}

const ViewCreditNote = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  
  const [creditNoteData, setCreditNoteData] = useState<CreditNoteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [formattedItems, setFormattedItems] = useState<FormattedItem[]>([]);

  useEffect(() => {
    const fetchCreditNoteData = async () => {
      if (!user || !id) return;

      try {
        setIsLoading(true);

        // Fetch credit note data
        const { data: creditNoteData, error: creditNoteError } = await supabase
          .from("credit_notes")
          .select(`
            *,
            client:clients(*)
          `)
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (creditNoteError) throw creditNoteError;
        if (!creditNoteData) throw new Error("Credit note not found");

        // Fetch credit note items
        const { data: creditNoteItems, error: itemsError } = await supabase
          .from("credit_note_items")
          .select(`
            *,
            item:items(*)
          `)
          .eq("credit_note_id", id);

        if (itemsError) throw itemsError;

        // Format items for internal use
        const formattedItemsForComponent = creditNoteItems.map((item) => ({
          id: item.item_id, // Use item_id as the identifier
          description: item.item.title || item.item_id,
          quantity: item.quantity,
          unit_price: Math.abs(item.total_amount) / item.quantity,
          amount: item.total_amount,
          vat_rate: item.item.vat,
        }));

        setFormattedItems(formattedItemsForComponent);
        setCreditNoteData({
          ...creditNoteData,
          items: creditNoteItems,
        });

        // Check for PDF URL in storage
        const { data: urlData } = supabase.storage
          .from('credit_notes')
          .getPublicUrl(`${id}/credit-note.pdf`);
          
        if (urlData && urlData.publicUrl) {
          setPdfUrl(urlData.publicUrl);
        }
      } catch (error: any) {
        console.error("Error fetching credit note data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to load credit note data",
        });
        navigate("/creditnotes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreditNoteData();
  }, [id, user, toast, navigate]);

  const handleGoBack = () => {
    navigate("/creditnotes");
  };

  const handleDownloadPDF = async () => {
    if (!creditNoteData || !pdfUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "PDF not available for download",
      });
      return;
    }

    try {
      window.open(pdfUrl, '_blank');
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to download PDF",
      });
    }
  };

  // Calculate VAT groups for the summary
  const getVatGroups = (): VatGroup[] => {
    if (!formattedItems || !formattedItems.length) return [];
    
    const groups = new Map<string, VatGroup>();
    
    formattedItems.forEach(item => {
      const vatRate = item.vat_rate;
      const amount = item.amount;
      
      if (amount === 0) return;
      
      let vatPercentage = 0;
      if (vatRate !== 'Exempt' && vatRate !== 'exempt') {
        vatPercentage = parseFloat(vatRate) || 0;
      }
      
      const vatAmount = vatRate === 'Exempt' || vatRate === 'exempt' 
        ? 0 
        : (amount * vatPercentage) / 100;
      
      if (groups.has(vatRate)) {
        const group = groups.get(vatRate)!;
        group.value += amount;
        group.amount += vatAmount;
      } else {
        groups.set(vatRate, {
          rate: vatRate,
          value: amount,
          amount: vatAmount
        });
      }
    });
    
    return Array.from(groups.values());
  };

  const renderStatus = () => {
    if (!creditNoteData) return null;
    
    const getStatusBadgeColor = (status: string) => {
      switch (status) {
        case 'draft':
          return 'bg-gray-100 text-gray-600 border-gray-200';
        case 'pending':
          return 'bg-amber-100 text-amber-600 border-amber-200';
        case 'paid':
          return 'bg-green-100 text-green-600 border-green-200';
        case 'overdue':
          return 'bg-red-100 text-red-600 border-red-200';
        default:
          return 'bg-gray-100 text-gray-600 border-gray-200';
      }
    };
    
    return (
      <span className={`px-3 py-1 text-sm font-medium border rounded-full ${getStatusBadgeColor(creditNoteData.status)}`}>
        {creditNoteData.status.charAt(0).toUpperCase() + creditNoteData.status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <button 
              onClick={handleGoBack}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold">View Credit Note</h2>
          </div>
          <div className="flex justify-center items-center h-[60vh]">
            <p className="text-muted-foreground">Loading credit note...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!creditNoteData) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <button 
              onClick={handleGoBack}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold">View Credit Note</h2>
          </div>
          <div className="flex justify-center items-center h-[60vh]">
            <p className="text-red-500">Credit note not found</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <button 
            onClick={handleGoBack}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold">View Credit Note</h2>
        </div>
        
        <div className="space-y-6">
          {/* Header with status and download button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              {renderStatus()}
            </div>
            <button 
              onClick={handleDownloadPDF} 
              className="flex items-center gap-2 apple-button rounded-full"
              disabled={!pdfUrl}
            >
              <Download size={18} />
              <span>Download PDF</span>
            </button>
          </div>
          
          {/* Credit Note Form */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CreditNoteBasicInfo
                creditNoteNumber={creditNoteData.credit_note_number}
                issueDate={creditNoteData.issue_date}
                readOnly={true}
              />
              
              <CreditNoteFrom
                userEmail={user?.email || ""}
                readOnly={true}
              />
            </div>
            
            <CreditNoteItems
              items={formattedItems}
              availableItems={[]}
              vats={[]}
              currencySymbol={currencySymbol}
              readOnly={true}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {creditNoteData.notes && (
                <CreditNoteNotes
                  notes={creditNoteData.notes}
                  readOnly={true}
                />
              )}
              
              <CreditNoteSummary
                vatGroups={getVatGroups()}
                total={creditNoteData.total_amount}
                currencySymbol={currencySymbol}
                readOnly={true}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ViewCreditNote;
