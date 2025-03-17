
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
    console.log(`PDF URL: ${pdfUrl || 'Not provided'}`);
    console.log(`Terms URL: ${termsAndConditionsUrl || 'Not provided'}`);
    
    const attachments = [];
    
    // Helper function to fetch and process PDF files
    async function fetchAndProcessPdf(url: string, filename: string): Promise<{ content: string, filename: string, type: string } | null> {
      try {
        console.log(`Fetching ${filename} from: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`Failed to fetch ${filename}: ${response.status} ${response.statusText}`);
          return null;
        }
        
        const buffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        
        console.log(`Successfully fetched ${filename}, size: ${uint8Array.length} bytes`);
        
        // Convert to base64 in smaller chunks to avoid call stack issues
        let binary = '';
        const chunkSize = 1024;
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, Math.min(i + chunkSize, uint8Array.length));
          for (let j = 0; j < chunk.length; j++) {
            binary += String.fromCharCode(chunk[j]);
          }
        }
        
        const base64Content = btoa(binary);
        console.log(`Successfully encoded ${filename} to base64`);
        
        return {
          content: base64Content,
          filename: filename,
          type: "application/pdf",
        };
      } catch (error) {
        console.error(`Error processing ${filename}:`, error);
        return null;
      }
    }
    
    // Only fetch and attach PDFs if includeAttachments is true
    if (includeAttachments) {
      // Process invoice PDF if URL is provided
      if (pdfUrl) {
        const invoicePdfAttachment = await fetchAndProcessPdf(pdfUrl, `invoice-${invoiceNumber}.pdf`);
        if (invoicePdfAttachment) {
          attachments.push(invoicePdfAttachment);
          console.log("Invoice PDF added to attachments");
        } else {
          console.log("Failed to add invoice PDF to attachments");
        }
      } else {
        console.log("No PDF URL provided for invoice");
      }

      // Process terms and conditions PDF if URL is provided
      if (termsAndConditionsUrl) {
        console.log("Processing terms and conditions PDF");
        const termsPdfAttachment = await fetchAndProcessPdf(termsAndConditionsUrl, "terms-and-conditions.pdf");
        if (termsPdfAttachment) {
          attachments.push(termsPdfAttachment);
          console.log("Terms and conditions PDF added to attachments");
        } else {
          console.log("Failed to add terms and conditions PDF to attachments, but continuing with email");
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
          <p>Please find your invoice #${invoiceNumber}${includeAttachments ? ' attached' : ' available in your account'}.</p>
          ${includeAttachments && termsAndConditionsUrl ? '<p>We have also attached our terms and conditions for your reference.</p>' : ''}
          ${!includeAttachments && pdfUrl ? `<p><a href="${pdfUrl}" target="_blank">Click here to view your invoice</a></p>` : ''}
          <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
          <p>Best regards,<br>${companyName || "PowerPeppol"}</p>
        </div>
      `,
    };
    
    console.log("Sending email via Resend with config:", {
      from: emailConfig.from,
      to: emailConfig.to,
      subject: emailConfig.subject,
      attachmentsCount: emailConfig.attachments.length
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
