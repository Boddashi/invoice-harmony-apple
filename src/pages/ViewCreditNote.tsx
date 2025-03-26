
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import CustomCard from "../components/ui/CustomCard";
import { ArrowLeft, Printer, Mail, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import CreditNoteHeader from "@/components/creditnotes/CreditNoteHeader";
import CreditNoteFrom from "@/components/creditnotes/CreditNoteFrom";
import CreditNoteBasicInfo from "@/components/creditnotes/CreditNoteBasicInfo";
import CreditNoteItems from "@/components/creditnotes/CreditNoteItems";
import CreditNoteNotes from "@/components/creditnotes/CreditNoteNotes";
import CreditNoteSummary from "@/components/creditnotes/CreditNoteSummary";
import { generateCreditNotePDF } from "@/utils/creditNotePdfGenerator";

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
  items?: {
    id: string;
    title: string;
    price: number;
    quantity: number;
    total_amount: number;
    vat: string;
  }[];
}

const ViewCreditNote = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  
  const [creditNoteData, setCreditNoteData] = useState<CreditNoteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

        // Format the items
        const formattedItems = creditNoteItems.map((item) => ({
          id: item.item.id,
          title: item.item.title,
          price: item.item.price,
          quantity: item.quantity,
          total_amount: item.total_amount,
          vat: item.item.vat,
        }));

        setCreditNoteData({
          ...creditNoteData,
          items: formattedItems,
        });
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

  const handlePrint = async () => {
    if (!creditNoteData) return;

    try {
      const pdfBlob = await generateCreditNotePDF(creditNoteData);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Open the PDF in a new tab and trigger print
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    } catch (error: any) {
      console.error("Error printing credit note:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to print credit note",
      });
    }
  };

  const handleDownload = async () => {
    if (!creditNoteData) return;

    try {
      const pdfBlob = await generateCreditNotePDF(creditNoteData);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `credit-note-${creditNoteData.credit_note_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Error downloading credit note:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to download credit note",
      });
    }
  };

  const handleSendEmail = async () => {
    if (!creditNoteData || !creditNoteData.client?.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Client email is missing",
      });
      return;
    }

    try {
      toast({
        title: "Sending email",
        description: "Please wait...",
      });

      // Generate PDF
      const pdfBlob = await generateCreditNotePDF(creditNoteData);
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        // Send email with PDF attachment
        const { error } = await supabase.functions.invoke("send-invoice-email", {
          body: {
            to: creditNoteData.client?.email,
            subject: `Credit Note ${creditNoteData.credit_note_number}`,
            pdfBase64: base64data,
            fileName: `credit-note-${creditNoteData.credit_note_number}.pdf`,
            creditNote: true,
          },
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Credit note sent successfully",
        });
      };
    } catch (error: any) {
      console.error("Error sending credit note email:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send credit note email",
      });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full py-20">
          <p>Loading credit note...</p>
        </div>
      </MainLayout>
    );
  }

  if (!creditNoteData) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full py-20">
          <p>Credit note not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full max-w-5xl mx-auto px-4 space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to Credit Notes</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="apple-button-secondary flex items-center gap-2 w-full sm:w-auto py-2 px-3"
            >
              <Printer size={18} />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="apple-button-secondary flex items-center gap-2 w-full sm:w-auto py-2 px-3"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={handleSendEmail}
              className="apple-button flex items-center gap-2 w-full sm:w-auto py-2 px-3"
            >
              <Mail size={18} />
              <span className="hidden sm:inline">Email</span>
            </button>
          </div>
        </div>

        <CustomCard className="p-6 md:p-8 shadow-md">
          <div className="space-y-8">
            <CreditNoteHeader readOnly={true} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CreditNoteFrom readOnly={true} />
              <CreditNoteBasicInfo 
                creditNoteNumber={creditNoteData.credit_note_number} 
                issueDate={creditNoteData.issue_date} 
                clientId={creditNoteData.client_id}
                clientName={creditNoteData.client?.name}
                readOnly={true}
              />
            </div>

            <CreditNoteItems 
              items={creditNoteData.items || []}
              readOnly={true}
              currencySymbol={currencySymbol}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CreditNoteNotes 
                notes={creditNoteData.notes || ""} 
                readOnly={true}
              />
              <CreditNoteSummary 
                subtotal={creditNoteData.amount} 
                taxRate={creditNoteData.tax_rate || 0} 
                taxAmount={creditNoteData.tax_amount || 0} 
                total={creditNoteData.total_amount}
                readOnly={true}
                currencySymbol={currencySymbol}
              />
            </div>
          </div>
        </CustomCard>
      </div>
    </MainLayout>
  );
};

export default ViewCreditNote;
