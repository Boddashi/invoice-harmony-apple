
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
      companySettings
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
        amountExcludingVat: item.amount,
        tax: {
          percentage: vatPercentage,
          category: "standard",
          country: client.country || "BE" // Default to Belgium if not provided
        }
      };
    });

    // Create tax subtotals grouped by percentage
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
      group.taxableAmount += item.amount;
      group.taxAmount += (item.amount * vatPercentage) / 100;
    });
    
    vatGroups.forEach(group => {
      taxSubtotals.push(group);
    });

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
          documentCurrencyCode: "EUR", // Assuming EUR as default currency
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
          amountIncludingVat: invoice.total_amount
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

    console.log("Successfully submitted document:", JSON.stringify(responseData));
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: responseData 
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
