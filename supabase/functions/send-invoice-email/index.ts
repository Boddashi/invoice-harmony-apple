
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
    
    const attachments = [];
    
    // Only fetch and attach PDFs if includeAttachments is true
    if (includeAttachments && pdfUrl) {
      console.log(`PDF URL: ${pdfUrl}`);
      
      try {
        // Fetch the PDF content to attach to the email
        console.log("Fetching PDF content...");
        const pdfResponse = await fetch(pdfUrl);
        if (!pdfResponse.ok) {
          console.error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
          throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
        }
        
        // Get the PDF data as ArrayBuffer
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const uint8Array = new Uint8Array(pdfBuffer);
        
        // Convert to base64 in smaller chunks to avoid call stack issues
        let binary = '';
        const chunkSize = 1024;
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, Math.min(i + chunkSize, uint8Array.length));
          for (let j = 0; j < chunk.length; j++) {
            binary += String.fromCharCode(chunk[j]);
          }
        }
        
        const pdfBase64 = btoa(binary);
        console.log("PDF content fetched and encoded successfully");

        attachments.push({
          content: pdfBase64,
          filename: `invoice-${invoiceNumber}.pdf`,
          type: "application/pdf",
        });
      } catch (error) {
        console.error("Error processing invoice PDF:", error);
        // Continue without PDF if there's an error
      }

      // Add Terms and Conditions if available
      if (termsAndConditionsUrl) {
        try {
          console.log("Fetching terms and conditions...");
          const termsResponse = await fetch(termsAndConditionsUrl);
          if (termsResponse.ok) {
            const termsBuffer = await termsResponse.arrayBuffer();
            const uint8Array = new Uint8Array(termsBuffer);
            
            // Convert to base64 in smaller chunks
            let binary = '';
            const chunkSize = 1024;
            for (let i = 0; i < uint8Array.length; i += chunkSize) {
              const chunk = uint8Array.slice(i, Math.min(i + chunkSize, uint8Array.length));
              for (let j = 0; j < chunk.length; j++) {
                binary += String.fromCharCode(chunk[j]);
              }
            }
            
            const termsBase64 = btoa(binary);
            console.log("Terms and conditions fetched and encoded successfully");
            
            attachments.push({
              content: termsBase64,
              filename: "terms-and-conditions.pdf",
              type: "application/pdf",
            });
          } else {
            console.error(`Failed to fetch terms: ${termsResponse.status} ${termsResponse.statusText}`);
          }
        } catch (error) {
          console.error("Error attaching terms and conditions:", error);
          // Continue without terms if there's an error
        }
      }
    }

    console.log("Sending email via Resend...");
    console.log("Email configuration:", {
      from: `${companyName || "PowerPeppol"} <info@powerpeppol.com>`,
      to: [clientEmail],
      subject: `Invoice #${invoiceNumber}`,
      attachmentsCount: attachments.length
    });
    
    const emailResponse = await resend.emails.send({
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
    });

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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
