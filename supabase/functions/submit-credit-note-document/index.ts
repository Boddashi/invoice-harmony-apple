
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STORECOVE_API_KEY = Deno.env.get('STORECOVE_API_KEY');
    
    if (!STORECOVE_API_KEY) {
      console.error("Missing Storecove API key in environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Credit note document submission function called");
    
    // Get the request body
    const requestData = await req.json();
    console.log("Request body parsed successfully");
    
    const { 
      creditNote, 
      client, 
      items,
      companySettings,
      pdfBase64,
      pdfUrl
    } = requestData;

    console.log("Received credit note data with PDF:", {
      creditNoteId: creditNote?.id,
      clientName: client?.name,
      hasPdfData: !!pdfBase64,
      pdfUrl: pdfUrl || 'Not provided',
      itemsCount: items?.length
    });

    if (!creditNote || !client || !items || items.length === 0 || !companySettings) {
      return new Response(
        JSON.stringify({ error: "Missing required data" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    let storecoveSubmissionResult = null;
    
    // Only proceed with Storecove submission if both company and client have legal entity IDs
    if (companySettings.legal_entity_id && client.legal_entity_id) {
      // Fetch client's legal entity information from Storecove
      const clientLegalEntityResponse = await fetch(
        `https://api.storecove.com/api/v2/legal_entities/${client.legal_entity_id}`,
        {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${STORECOVE_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!clientLegalEntityResponse.ok) {
        console.error("Failed to fetch client's legal entity information:", await clientLegalEntityResponse.text());
        return new Response(
          JSON.stringify({ 
            error: "Failed to fetch client's legal entity information",
            status: clientLegalEntityResponse.status
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      const clientLegalEntity = await clientLegalEntityResponse.json();
      console.log("Client legal entity information:", JSON.stringify(clientLegalEntity));

      // Extract PEPPOL identifier if available
      let peppolIdentifier = null;
      if (clientLegalEntity.peppol_identifiers && clientLegalEntity.peppol_identifiers.length > 0) {
        peppolIdentifier = clientLegalEntity.peppol_identifiers[0];
        console.log("Found PEPPOL identifier:", JSON.stringify(peppolIdentifier));
      }

      // Helper function to map VAT rates to Storecove tax categories
      const mapTaxCategory = (vatRate: string | number, category?: string): string => {
        // If a category is provided from the item, use it directly
        if (category) {
          // Make sure we map to valid Storecove categories
          switch (category.toLowerCase()) {
            case "zero":
              return "zero_rated";
            case "exempt":
              return "exempt";
            case "standard":
              return "standard";
            default:
              return "standard"; // Default fallback
          }
        }
        
        // Otherwise, determine based on rate
        const rateValue = typeof vatRate === 'string' ? parseFloat(vatRate) : vatRate;
        
        if (rateValue === 0) return "zero_rated";
        if (isNaN(rateValue) || vatRate === "exempt" || vatRate === "Exempt") return "exempt";
        
        // Default to standard for any other case
        return "standard";
      };

      // Create invoice lines and tax subtotals - with negative amounts for credit notes
      const invoiceLines = items.map(item => {
        const vatRateStr = item.vat_rate;
        const vatPercentage = parseFloat(vatRateStr) || 0;
        const taxCategory = mapTaxCategory(vatRateStr, item.category);
        
        console.log(`Processing line item with VAT rate: ${vatRateStr}, category: ${taxCategory}`);
        
        // Make sure amount is negative for credit notes
        const amount = Math.abs(parseFloat(item.amount.toFixed(2))) * -1;
        
        return {
          description: item.description,
          amountExcludingVat: amount,
          tax: {
            percentage: vatPercentage,
            category: taxCategory,
            country: client.country || "BE" // Default to Belgium if not provided
          }
        };
      });

      // Create tax subtotals grouped by percentage with precise calculations and negative amounts
      const taxSubtotals = [];
      const vatGroups = new Map();
      
      items.forEach(item => {
        const vatRateStr = item.vat_rate;
        const vatPercentage = parseFloat(vatRateStr) || 0;
        const taxCategory = mapTaxCategory(vatRateStr, item.category);
        const key = `${vatPercentage}-${taxCategory}-${client.country || "BE"}`;
        
        if (!vatGroups.has(key)) {
          vatGroups.set(key, {
            percentage: vatPercentage,
            category: taxCategory,
            country: client.country || "BE",
            taxableAmount: 0,
            taxAmount: 0
          });
        }
        
        const group = vatGroups.get(key);
        // Make sure we have a negative amount for credit notes
        const itemAmount = Math.abs(parseFloat(item.amount.toFixed(2))) * -1;
        group.taxableAmount += itemAmount;
        
        // Calculate tax amount with precision (also negative)
        const itemTaxAmount = (Math.abs(itemAmount) * vatPercentage) / 100 * -1;
        group.taxAmount += parseFloat(itemTaxAmount.toFixed(2));
      });
      
      vatGroups.forEach(group => {
        // Format numbers to avoid floating point issues
        group.taxableAmount = parseFloat(group.taxableAmount.toFixed(2));
        group.taxAmount = parseFloat(group.taxAmount.toFixed(2));
        taxSubtotals.push(group);
      });

      // Calculate precise total amount from tax subtotals - should be negative for credit notes
      const totalTaxableAmount = parseFloat(taxSubtotals.reduce((sum, tax) => sum + tax.taxableAmount, 0).toFixed(2));
      const totalTaxAmount = parseFloat(taxSubtotals.reduce((sum, tax) => sum + tax.taxAmount, 0).toFixed(2));
      const preciseAmountIncludingVat = parseFloat((totalTaxableAmount + totalTaxAmount).toFixed(2));

      // Prepare payment means array
      const paymentMeansArray = [];
      if (companySettings?.iban) {
        paymentMeansArray.push({
          account: companySettings.iban,
          holder: companySettings.company_name || "Your Company",
          code: "credit_transfer"
        });
      }

      // Prepare routing section with emails and eIdentifiers
      const routingConfig = {
        emails: client.email ? [client.email] : []
      };

      // Add eIdentifiers from the retrieved PEPPOL identifier
      if (peppolIdentifier && peppolIdentifier.scheme && peppolIdentifier.identifier) {
        routingConfig.eIdentifiers = [
          {
            scheme: peppolIdentifier.scheme,
            id: peppolIdentifier.identifier
          }
        ];
      }
      // Fallback to using client's VAT number if no PEPPOL identifier found but client is a business with VAT number
      else if (client.type === 'business' && client.vat_number) {
        const countryCode = client.country || 'BE';
        routingConfig.eIdentifiers = [
          {
            scheme: `${countryCode}:VAT`,
            id: client.vat_number
          }
        ];
      }

      // Format data for Storecove API - IMPORTANT: Use "invoice" as documentType even for credit notes
      const documentSubmission = {
        legalEntityId: companySettings.legal_entity_id,
        receiverLegalEntityId: client.legal_entity_id,
        routing: routingConfig,
        document: {
          documentType: "invoice", // Always use "invoice" as the documentType, even for credit notes
          invoice: {
            invoiceNumber: creditNote.credit_note_number,
            issueDate: creditNote.issue_date,
            documentCurrencyCode: "EUR", // Always use EUR as currency
            taxSystem: "tax_line_percentages",
            accountingCustomerParty: {
              party: {
                companyName: client.name,
                address: {
                  street1: client.street ? `${client.street} ${client.number || ''}`.trim() : "",
                  zip: client.postcode || "",
                  city: client.city || "",
                  country: client.country || ""
                }
              }
            },
            invoiceLines: invoiceLines,
            taxSubtotals: taxSubtotals,
            paymentMeansArray: paymentMeansArray.length > 0 ? paymentMeansArray : undefined,
            amountIncludingVat: preciseAmountIncludingVat // Use the accurately calculated total (negative)
          }
        }
      };

      // Add note to invoice if it exists
      if (creditNote.notes && creditNote.notes.trim()) {
        documentSubmission.document.invoice.note = `CREDIT NOTE: ${creditNote.notes.trim()}`;
      } else {
        documentSubmission.document.invoice.note = "CREDIT NOTE";
      }

      // Add publicIdentifiers to accountingCustomerParty using the same identifiers retrieved from Storecove
      if (peppolIdentifier && peppolIdentifier.scheme && peppolIdentifier.identifier) {
        documentSubmission.document.invoice.accountingCustomerParty.publicIdentifiers = [
          {
            scheme: peppolIdentifier.scheme,
            id: peppolIdentifier.identifier
          }
        ];
      }
      // Fallback to using client's VAT number if no PEPPOL identifier found but client is a business with VAT number
      else if (client.type === 'business' && client.vat_number) {
        const countryCode = client.country || 'BE';
        documentSubmission.document.invoice.accountingCustomerParty.publicIdentifiers = [
          {
            scheme: `${countryCode}:VAT`,
            id: client.vat_number
          }
        ];
      }

      console.log("Sending credit note document submission to Storecove:", JSON.stringify(documentSubmission));

      // Make request to Storecove API
      const response = await fetch("https://api.storecove.com/api/v2/document_submissions", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${STORECOVE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(documentSubmission)
      });

      const responseData = await response.json();
      
      // Check if the request was successful
      if (!response.ok) {
        console.error("Storecove API error:", JSON.stringify(responseData));
        return new Response(
          JSON.stringify({ 
            error: "Failed to submit document", 
            details: responseData 
          }),
          { 
            status: response.status, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      console.log("Successfully submitted credit note to Storecove:", JSON.stringify(responseData));
      storecoveSubmissionResult = responseData;
    } else {
      console.log("Skipping Storecove submission due to missing legal entity IDs", {
        companyLegalEntityId: companySettings.legal_entity_id,
        clientLegalEntityId: client.legal_entity_id
      });
    }
    
    // Always send email with PDF attachment regardless of Storecove submission
    let emailSent = false;
    let emailError = null;
    
    try {
      console.log("Sending credit note email via send-invoice-email function");
      
      // Verify that client email exists
      if (!client.email) {
        console.error("Cannot send email: Client email is missing");
        throw new Error("Client email is required for email sending");
      }
      
      // Prepare terms and conditions URL
      const termsAndConditionsUrl = companySettings?.terms_and_conditions_url || null;
      
      // Check if we should include Yuki email
      const yukiEmail = companySettings?.yuki_email || undefined;
      
      // Prepare email data
      const emailData = {
        clientName: client.name,
        clientEmail: client.email,
        invoiceNumber: creditNote.credit_note_number, // Use credit note number
        pdfUrl: pdfUrl,
        termsAndConditionsUrl: termsAndConditionsUrl,
        companyName: companySettings?.company_name || "PowerPeppol",
        includeAttachments: true,
        pdfBase64: pdfBase64,
        yukiEmail: yukiEmail,
        isCreditNote: true // Flag to indicate this is a credit note
      };
      
      console.log("Preparing to send email with data:", {
        to: client.email,
        creditNoteNumber: creditNote.credit_note_number,
        yukiCopy: !!yukiEmail,
        hasAttachment: !!pdfBase64
      });
      
      // Call send-invoice-email function with the PDF data
      const emailResponse = await fetch("https://sjwqxbjxjlsdngbldhcq.supabase.co/functions/v1/send-invoice-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
          ...corsHeaders
        },
        body: JSON.stringify(emailData)
      });

      if (!emailResponse.ok) {
        const emailErrorData = await emailResponse.json();
        console.error("Email sending error:", JSON.stringify(emailErrorData));
        emailError = emailErrorData.error || "Unknown email error";
        throw new Error(`Email sending failed: ${emailError}`);
      } else {
        const emailResult = await emailResponse.json();
        console.log("Email sent successfully:", JSON.stringify(emailResult));
        emailSent = true;
      }
    } catch (emailErr) {
      console.error("Error sending credit note email:", emailErr);
      // We don't fail the whole operation if email fails, just log the error
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: storecoveSubmissionResult || { guid: creditNote.id },
        emailSent: emailSent,
        emailError: emailError
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in submit-credit-note-document function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
