
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import CustomCard from "../components/ui/CustomCard";
import { ArrowLeft, Download, Mail, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { generateCreditNotePDF } from "@/utils/creditNotePdfGenerator";
import CreditNoteHeader from "@/components/creditnotes/CreditNoteHeader";
import CreditNoteBasicInfo from "@/components/creditnotes/CreditNoteBasicInfo";
import CreditNoteFrom from "@/components/creditnotes/CreditNoteFrom";
import CreditNoteItems from "@/components/creditnotes/CreditNoteItems";
import CreditNoteNotes from "@/components/creditnotes/CreditNoteNotes";
import CreditNoteSummary from "@/components/creditnotes/CreditNoteSummary";

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

        // Check if PDF exists and get URL
        if (creditNoteData.pdf_url) {
          setPdfUrl(creditNoteData.pdf_url);
        } else {
          const { data: urlData } = supabase.storage
            .from('credit_notes')
            .getPublicUrl(`${id}/credit-note.pdf`);
            
          if (urlData && urlData.publicUrl) {
            setPdfUrl(urlData.publicUrl);
          }
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
    if (!creditNoteData || !user) return;

    if (pdfUrl) {
      // If PDF URL exists, open it in a new tab
      window.open(pdfUrl, '_blank');
      return;
    }

    try {
      toast({
        title: "Generating PDF",
        description: "Please wait...",
      });

      // Prepare data for PDF generation
      const clientAddress = formatAddress(creditNoteData.client);
      
      const pdfData = {
        id: creditNoteData.id,
        credit_note_number: creditNoteData.credit_note_number,
        issue_date: creditNoteData.issue_date,
        client_name: creditNoteData.client?.name || "",
        client_address: clientAddress,
        client_vat: creditNoteData.client?.vat_number,
        user_email: user.email || "",
        items: formatItems(creditNoteData.items || []),
        subTotal: creditNoteData.amount,
        taxAmount: creditNoteData.tax_amount || 0,
        total: creditNoteData.total_amount,
        notes: creditNoteData.notes,
        currencySymbol: currencySymbol
      };

      const pdfBlob = await generateCreditNotePDF(pdfData);
      
      // Convert the base64 data to a Blob
      const base64Response = await fetch(`data:application/pdf;base64,${pdfBlob.base64}`);
      const blob = await base64Response.blob();
      
      // Create a URL for the blob
      const pdfObjectUrl = URL.createObjectURL(blob);
      
      // Open the PDF in a new tab
      window.open(pdfObjectUrl, '_blank');
      
      toast({
        title: "Success",
        description: "PDF generated successfully",
      });
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate PDF",
      });
    }
  };

  // Helper function to format address
  const formatAddress = (client?: CreditNoteData['client']) => {
    if (!client) return "";
    
    const parts = [
      client.street && client.number ? `${client.street} ${client.number}${client.bus ? `, ${client.bus}` : ''}` : undefined,
      client.postcode && client.city ? `${client.postcode} ${client.city}` : undefined,
      client.country
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : "";
  };

  // Helper function to format items for PDF generation
  const formatItems = (items: CreditNoteData['items']) => {
    if (!items || !items.length) return [];
    
    return items.map(item => ({
      description: item.title,
      quantity: item.quantity,
      unit_price: item.price,
      vat_rate: item.vat,
      amount: item.total_amount
    }));
  };

  // Calculate VAT groups
  const getVatGroups = (): VatGroup[] => {
    if (!creditNoteData || !creditNoteData.items) return [];
    
    const groups = new Map<string, VatGroup>();
    
    creditNoteData.items.forEach(item => {
      const vatRate = item.vat;
      const amount = item.total_amount;
      
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

  // Format credit note items for CreditNoteItems component
  const formatCreditNoteItems = () => {
    if (!creditNoteData || !creditNoteData.items) return [];
    
    return creditNoteData.items.map(item => ({
      id: item.id,
      description: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      amount: item.total_amount,
      vat_rate: item.vat
    }));
  };

  const renderStatus = () => {
    if (!creditNoteData) return null;
    
    const getStatusBadgeColor = (status: string) => {
      switch (status) {
        case 'draft':
          return 'bg-gray-100 text-gray-600 border-gray-200';
        case 'pending':
          return 'bg-apple-orange/10 text-apple-orange border-apple-orange/20';
        case 'paid':
          return 'bg-apple-green/10 text-apple-green border-apple-green/20';
        case 'overdue':
          return 'bg-apple-red/10 text-apple-red border-apple-red/20';
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
            >
              <Download size={18} />
              <span>Download PDF</span>
            </button>
          </div>
          
          {/* Credit Note Form */}
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CreditNoteBasicInfo
                creditNoteNumber={creditNoteData.credit_note_number}
                issueDate={creditNoteData.issue_date}
                selectedClientId={creditNoteData.client_id}
                clients={[]}
                setSelectedClientId={() => {}}
                setIssueDate={() => {}}
                setCreditNoteNumber={() => {}}
                isAddClientModalOpen={false}
                setIsAddClientModalOpen={() => {}}
                isEditMode={false}
                readOnly={true}
              />
              
              <CreditNoteFrom
                userEmail={user?.email || ""}
                readOnly={true}
              />
            </div>
            
            <CreditNoteItems
              items={formatCreditNoteItems()}
              availableItems={[]}
              setItems={() => {}}
              handleItemDescriptionChange={() => {}}
              handleItemQuantityChange={() => {}}
              handleItemUnitPriceChange={() => {}}
              handleItemVatChange={() => {}}
              handleAddItem={() => {}}
              handleRemoveItem={() => {}}
              currencySymbol={currencySymbol}
              vats={[]}
              readOnly={true}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {creditNoteData.notes && (
                <CreditNoteNotes
                  notes={creditNoteData.notes}
                  setNotes={() => {}}
                  readOnly={true}
                />
              )}
              
              <CreditNoteSummary
                items={formatCreditNoteItems()}
                total={creditNoteData.total_amount}
                currencySymbol={currencySymbol}
                getVatGroups={() => getVatGroups()}
                readOnly={true}
              />
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default ViewCreditNote;
