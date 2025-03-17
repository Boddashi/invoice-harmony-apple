
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
    
    // Helper function to fetch PDF as binary data
    async function fetchPdf(url: string): Promise<Uint8Array | null> {
      try {
        console.log(`Fetching PDF from: ${url}`);
        
        // Make sure we have a properly formatted URL
        const fetchUrl = url.startsWith('http') ? url : `https://${url}`;
        
        const response = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf'
          }
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
          return null;
        }
        
        // Get the PDF as an ArrayBuffer and convert to Uint8Array
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      } catch (error) {
        console.error(`Error fetching PDF:`, error);
        return null;
      }
    }
    
    // Only fetch and attach PDFs if includeAttachments is true
    if (includeAttachments) {
      // Process invoice PDF if URL is provided
      if (pdfUrl) {
        try {
          console.log(`Processing invoice PDF from: ${pdfUrl}`);
          const pdfData = await fetchPdf(pdfUrl);
          
          if (pdfData) {
            attachments.push({
              filename: `invoice-${invoiceNumber}.pdf`,
              content: pdfData
            });
            console.log("Invoice PDF added to attachments");
          } else {
            console.log("Failed to fetch invoice PDF, continuing without it");
          }
        } catch (error) {
          console.error("Error processing invoice PDF:", error);
          // Continue without the invoice attachment
        }
      } else {
        console.log("No PDF URL provided for invoice");
      }

      // Process terms and conditions PDF if URL is provided
      if (termsAndConditionsUrl) {
        try {
          console.log(`Processing terms PDF from: ${termsAndConditionsUrl}`);
          const termsData = await fetchPdf(termsAndConditionsUrl);
          
          if (termsData) {
            attachments.push({
              filename: "terms-and-conditions.pdf",
              content: termsData
            });
            console.log("Terms and conditions PDF added to attachments");
          } else {
            console.log("Failed to fetch terms PDF, continuing without it");
          }
        } catch (error) {
          console.error("Error processing terms PDF:", error);
          // Continue without the terms attachment
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
    
    let emailResponse;
    try {
      emailResponse = await resend.emails.send(emailConfig);
      console.log("Email sent successfully:", emailResponse);
    } catch (emailError: any) {
      console.error("Resend API error:", emailError);
      
      // If attachments are causing problems, try again without them
      if (attachments.length > 0) {
        console.log("Trying to send email without attachments as fallback");
        const fallbackConfig = {
          ...emailConfig,
          attachments: [],
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Invoice #${invoiceNumber}</h2>
              <p>Dear ${clientName},</p>
              <p>Your invoice #${invoiceNumber} is available in your account.</p>
              ${pdfUrl ? `<p><a href="${pdfUrl}" target="_blank">Click here to view your invoice</a></p>` : ''}
              ${termsAndConditionsUrl ? `<p><a href="${termsAndConditionsUrl}" target="_blank">View our terms and conditions</a></p>` : ''}
              <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
              <p>Best regards,<br>${companyName || "PowerPeppol"}</p>
            </div>
          `,
        };
        
        try {
          emailResponse = await resend.emails.send(fallbackConfig);
          console.log("Fallback email without attachments sent successfully:", emailResponse);
        } catch (fallbackError: any) {
          console.error("Fallback email sending failed:", fallbackError);
          throw fallbackError;
        }
      } else {
        throw emailError;
      }
    }

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
