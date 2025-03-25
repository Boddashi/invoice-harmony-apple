
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get the request body
    const requestData = await req.json();
    const { 
      invoice, 
      client, 
      items,
      companySettings,
      pdfBase64,   // Added to receive PDF data for email
      pdfUrl       // Added to receive PDF URL for email
    } = requestData;

    console.log("Received invoice data:", JSON.stringify(requestData));

    if (!invoice || !client || !items || items.length === 0 || !companySettings) {
      return new Response(
        JSON.stringify({ error: "Missing required data" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check if the company has a legal entity ID
    if (!companySettings.legal_entity_id) {
      return new Response(
        JSON.stringify({ error: "Company does not have a Storecove legal entity", missingCompanyLegalEntity: true }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check if the client has a legal entity ID
    if (!client.legal_entity_id) {
      return new Response(
        JSON.stringify({ error: "Client does not have a Storecove legal entity", missingClientLegalEntity: true }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Ensure we always have PDF Base64 data - required for sending email with attachment
    if (!pdfBase64) {
      console.warn("PDF Base64 data not provided, email might be sent without attachment");
    }

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

    // Create invoice lines and tax subtotals
    const invoiceLines = items.map(item => {
      const vatPercentage = parseFloat(item.vat_rate) || 0;
      return {
        description: item.description,
        amountExcludingVat: parseFloat(item.amount.toFixed(2)),
        tax: {
          percentage: vatPercentage,
          category: "standard",
          country: client.country || "BE" // Default to Belgium if not provided
        }
      };
    });

    // Create tax subtotals grouped by percentage with precise calculations
    const taxSubtotals = [];
    const vatGroups = new Map();
    
    items.forEach(item => {
      const vatPercentage = parseFloat(item.vat_rate) || 0;
      const key = `${vatPercentage}-standard-${client.country || "BE"}`;
      
      if (!vatGroups.has(key)) {
        vatGroups.set(key, {
          percentage: vatPercentage,
          category: "standard",
          country: client.country || "BE",
          taxableAmount: 0,
          taxAmount: 0
        });
      }
      
      const group = vatGroups.get(key);
      const itemAmount = parseFloat(item.amount.toFixed(2));
      group.taxableAmount += itemAmount;
      
      // Calculate tax amount with precision
      const itemTaxAmount = (itemAmount * vatPercentage) / 100;
      group.taxAmount += parseFloat(itemTaxAmount.toFixed(2));
    });
    
    vatGroups.forEach(group => {
      // Format numbers to avoid floating point issues
      group.taxableAmount = parseFloat(group.taxableAmount.toFixed(2));
      group.taxAmount = parseFloat(group.taxAmount.toFixed(2));
      taxSubtotals.push(group);
    });

    // Calculate precise total amount from tax subtotals
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

    // Format data for Storecove API - using the company's legal entity ID as the sender
    // and the client's legal entity ID as the receiver
    const documentSubmission = {
      legalEntityId: companySettings.legal_entity_id,
      receiverLegalEntityId: client.legal_entity_id,
      routing: routingConfig,
      document: {
        documentType: "invoice",
        invoice: {
          invoiceNumber: invoice.invoice_number,
          issueDate: invoice.issue_date,
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
          amountIncludingVat: preciseAmountIncludingVat // Use the accurately calculated total
        }
      }
    };

    // Add note to invoice if it exists
    if (invoice.notes && invoice.notes.trim()) {
      documentSubmission.document.invoice.note = invoice.notes.trim();
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

    console.log("Sending document submission to Storecove:", JSON.stringify(documentSubmission));

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

    console.log("Successfully submitted document to Storecove:", JSON.stringify(responseData));
    
    // Always send email with PDF attachment regardless of Storecove submission
    let emailSent = false;
    try {
      console.log("Sending invoice email via send-invoice-email function");
      
      // Prepare terms and conditions URL
      const termsAndConditionsUrl = companySettings?.terms_and_conditions_url || null;
      
      // Check if we should include Yuki email
      const yukiEmail = companySettings?.yuki_email || null;
      
      // Call send-invoice-email function with the PDF data
      const emailResponse = await fetch("https://sjwqxbjxjlsdngbldhcq.supabase.co/functions/v1/send-invoice-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        body: JSON.stringify({
          clientName: client.name,
          clientEmail: client.email,
          invoiceNumber: invoice.invoice_number,
          pdfUrl: pdfUrl,
          termsAndConditionsUrl: termsAndConditionsUrl,
          companyName: companySettings?.company_name || "PowerPeppol",
          includeAttachments: true,
          pdfBase64: pdfBase64,
          yukiEmail: yukiEmail
        })
      });

      if (!emailResponse.ok) {
        const emailError = await emailResponse.json();
        console.error("Email sending error:", JSON.stringify(emailError));
        // We don't fail the whole operation if email fails, just log the error
      } else {
        const emailData = await emailResponse.json();
        console.log("Email sent successfully:", JSON.stringify(emailData));
        emailSent = true;
      }
    } catch (emailError) {
      console.error("Error sending invoice email:", emailError);
      // We don't fail the whole operation if email fails, just log the error
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: responseData,
        emailSent
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in submit-invoice-document function:", error);
    
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
