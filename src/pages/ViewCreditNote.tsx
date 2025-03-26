
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
    if (!creditNoteData || !user) return;

    try {
      // Prepare data for PDF generation
      const pdfData = {
        id: creditNoteData.id,
        credit_note_number: creditNoteData.credit_note_number,
        issue_date: creditNoteData.issue_date,
        client_name: creditNoteData.client?.name || "",
        client_address: formatAddress(creditNoteData.client),
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
      const base64Response = await fetch(pdfBlob.base64);
      const blob = await base64Response.blob();
      
      const pdfUrl = URL.createObjectURL(blob);
      
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
    if (!creditNoteData || !user) return;

    try {
      // Prepare data for PDF generation
      const pdfData = {
        id: creditNoteData.id,
        credit_note_number: creditNoteData.credit_note_number,
        issue_date: creditNoteData.issue_date,
        client_name: creditNoteData.client?.name || "",
        client_address: formatAddress(creditNoteData.client),
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
      const base64Response = await fetch(pdfBlob.base64);
      const blob = await base64Response.blob();
      
      const pdfUrl = URL.createObjectURL(blob);
      
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
    if (!creditNoteData || !creditNoteData.client?.email || !user) {
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

      // Prepare data for PDF generation
      const pdfData = {
        id: creditNoteData.id,
        credit_note_number: creditNoteData.credit_note_number,
        issue_date: creditNoteData.issue_date,
        client_name: creditNoteData.client?.name || "",
        client_address: formatAddress(creditNoteData.client),
        client_vat: creditNoteData.client?.vat_number,
        user_email: user.email || "",
        items: formatItems(creditNoteData.items || []),
        subTotal: creditNoteData.amount,
        taxAmount: creditNoteData.tax_amount || 0,
        total: creditNoteData.total_amount,
        notes: creditNoteData.notes,
        currencySymbol: currencySymbol
      };
      
      // Generate PDF
      const pdfBlob = await generateCreditNotePDF(pdfData);
      
      // Get base64 data
      const base64data = pdfBlob.base64;
      
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
    } catch (error: any) {
      console.error("Error sending credit note email:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send credit note email",
      });
    }
  };

  // Helper function to format address
  const formatAddress = (client?: CreditNoteData['client']) => {
    if (!client) return undefined;
    
    const parts = [
      client.street && client.number ? `${client.street} ${client.number}${client.bus ? `, ${client.bus}` : ''}` : undefined,
      client.postcode && client.city ? `${client.postcode} ${client.city}` : undefined,
      client.country
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : undefined;
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

  // Format items for the CreditNoteItems component
  const formattedItems = creditNoteData.items?.map(item => ({
    id: item.id,
    description: item.title,
    quantity: item.quantity,
    unit_price: item.price,
    amount: item.total_amount,
    vat_rate: item.vat
  })) || [];

  // Calculate VAT groups for the summary component
  const vatGroups = creditNoteData.items?.reduce((groups, item) => {
    const vatRate = item.vat;
    const amount = item.total_amount;
    
    // Find existing group
    const existingGroup = groups.find(group => group.rate === vatRate);
    if (existingGroup) {
      existingGroup.value += (amount / (1 + parseFloat(vatRate) / 100));
      existingGroup.amount += (amount - (amount / (1 + parseFloat(vatRate) / 100)));
      return groups;
    }
    
    // Create new group
    const vatAmount = parseFloat(vatRate) > 0 
      ? amount - (amount / (1 + parseFloat(vatRate) / 100)) 
      : 0;
    
    groups.push({
      rate: vatRate,
      value: amount - vatAmount,
      amount: vatAmount
    });
    
    return groups;
  }, [] as Array<{rate: string, value: number, amount: number}>);

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
            <h1 className="text-2xl font-semibold">Credit Note {creditNoteData.credit_note_number}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CreditNoteFrom 
                userEmail={user?.email} 
              />
              <div className="space-y-4">
                <div className="text-sm">
                  <p className="text-muted-foreground">Credit Note Number</p>
                  <p className="font-medium">{creditNoteData.credit_note_number}</p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Issue Date</p>
                  <p className="font-medium">{new Date(creditNoteData.issue_date).toLocaleDateString()}</p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Client</p>
                  <p className="font-medium">{creditNoteData.client?.name}</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    <th className="px-4 py-2 text-right">Unit Price</th>
                    <th className="px-4 py-2 text-right">VAT</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {formattedItems.map((item) => (
                    <tr key={item.id} className="border-b border-border/30">
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{currencySymbol}{item.unit_price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{item.vat_rate}</td>
                      <td className="px-4 py-3 text-right font-medium">{currencySymbol}{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {creditNoteData.notes && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Notes</h3>
                  <p className="text-sm text-muted-foreground">{creditNoteData.notes}</p>
                </div>
              )}
              <div className="space-y-4 md:ml-auto md:w-64">
                {vatGroups?.map((group, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal ({group.rate})</span>
                      <span>{currencySymbol}{group.value.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">VAT {group.rate}</span>
                      <span>{currencySymbol}{group.amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{currencySymbol}{creditNoteData.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </CustomCard>
      </div>
    </MainLayout>
  );
};

export default ViewCreditNote;
