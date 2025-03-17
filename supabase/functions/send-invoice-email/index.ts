
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendInvoiceEmailRequest {
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  pdfUrl?: string;
  termsAndConditionsUrl?: string;
  companyName: string;
  includeAttachments?: boolean;
}

// Helper function to fetch and convert a PDF to base64
async function fetchPdfAsBase64(url: string): Promise<string | null> {
  try {
    console.log(`Fetching PDF from ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    // Convert array buffer to base64 using a simpler approach
    const uint8Array = new Uint8Array(arrayBuffer);
    let binaryString = '';
    uint8Array.forEach(byte => {
      binaryString += String.fromCharCode(byte);
    });
    const base64 = btoa(binaryString);
    
    console.log(`Successfully fetched PDF, size: ${arrayBuffer.byteLength} bytes`);
    return base64;
  } catch (error) {
    console.error(`Error fetching PDF:`, error);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received request to send invoice email");
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData));
    
    const { 
      clientName, 
      clientEmail, 
      invoiceNumber, 
      pdfUrl, 
      termsAndConditionsUrl, 
      companyName,
      includeAttachments = true
    }: SendInvoiceEmailRequest = requestData;

    if (!clientEmail) {
      console.error("Client email is required but was not provided");
      throw new Error("Client email is required");
    }

    console.log(`Sending invoice email to ${clientEmail}`);
    console.log(`Include attachments: ${includeAttachments}`);
    
    const attachments = [];
    
    // Only attempt to attach PDFs if includeAttachments is true and URLs are provided
    if (includeAttachments) {
      // Process invoice PDF if URL is provided
      if (pdfUrl) {
        console.log(`Attempting to fetch invoice PDF from: ${pdfUrl}`);
        const invoicePdfBase64 = await fetchPdfAsBase64(pdfUrl);
        
        if (invoicePdfBase64) {
          attachments.push({
            filename: `invoice-${invoiceNumber}.pdf`,
            content: invoicePdfBase64,
            type: "application/pdf",
          });
          console.log("Invoice PDF added to attachments array");
        } else {
          console.error("Failed to add invoice PDF to attachments");
        }
      } else {
        console.log("No PDF URL provided for invoice");
      }

      // Process terms and conditions PDF if URL is provided
      if (termsAndConditionsUrl) {
        console.log(`Attempting to fetch terms and conditions PDF from: ${termsAndConditionsUrl}`);
        const termsPdfBase64 = await fetchPdfAsBase64(termsAndConditionsUrl);
        
        if (termsPdfBase64) {
          attachments.push({
            filename: "terms-and-conditions.pdf",
            content: termsPdfBase64,
            type: "application/pdf",
          });
          console.log("Terms and conditions PDF added to attachments array");
        } else {
          console.error("Failed to add terms and conditions PDF to attachments");
        }
      } else {
        console.log("No terms and conditions URL provided");
      }
    }

    console.log(`Preparing to send email with ${attachments.length} attachments`);
    
    const emailConfig = {
      from: `${companyName || "PowerPeppol"} <info@powerpeppol.com>`,
      to: [clientEmail],
      subject: `Invoice #${invoiceNumber}`,
      attachments: attachments,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Invoice #${invoiceNumber}</h2>
          <p>Dear ${clientName},</p>
          <p>Please find your invoice #${invoiceNumber}${attachments.length > 0 ? ' attached' : ' available in your account'}.</p>
          ${attachments.length > 1 ? '<p>We have also attached our terms and conditions for your reference.</p>' : ''}
          ${attachments.length === 0 && pdfUrl ? `<p><a href="${pdfUrl}" target="_blank">Click here to view your invoice</a></p>` : ''}
          <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
          <p>Best regards,<br>${companyName || "PowerPeppol"}</p>
        </div>
      `,
    };
    
    console.log("Sending email via Resend with config:", {
      from: emailConfig.from,
      to: emailConfig.to,
      subject: emailConfig.subject,
      attachmentsCount: emailConfig.attachments.length,
      attachmentDetails: attachments.map(a => ({ 
        filename: a.filename, 
        contentLength: a.content.length 
      }))
    });
    
    const emailResponse = await resend.emails.send(emailConfig);
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending invoice email:", error);
    
    // Return a more detailed error response
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
