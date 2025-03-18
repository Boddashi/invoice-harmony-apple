
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
    
    if (includeAttachments) {
      // Process invoice PDF if URL is provided
      if (pdfUrl) {
        try {
          console.log(`Fetching invoice PDF from: ${pdfUrl}`);
          
          const fetchUrl = pdfUrl.startsWith('http') ? pdfUrl : `https://${pdfUrl}`;
          
          const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/pdf',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (!response.ok) {
            console.error(`Failed to fetch invoice PDF: ${response.status} ${response.statusText}`);
          } else {
            console.log("Invoice PDF fetched successfully");
            const arrayBuffer = await response.arrayBuffer();
            const pdfData = new Uint8Array(arrayBuffer);
            
            // Process in smaller chunks to avoid memory issues
            const chunkSize = 512 * 1024; // 512KB chunks
            const chunks = [];
            for (let i = 0; i < pdfData.length; i += chunkSize) {
              chunks.push(pdfData.slice(i, i + chunkSize));
            }
            
            const processedPdf = new Uint8Array(pdfData.length);
            let offset = 0;
            for (const chunk of chunks) {
              processedPdf.set(chunk, offset);
              offset += chunk.length;
            }
            
            attachments.push({
              filename: `invoice-${invoiceNumber}.pdf`,
              content: processedPdf
            });
            console.log("Invoice PDF successfully added to attachments");
          }
        } catch (error) {
          console.error("Error processing invoice PDF:", error);
          // Continue without the invoice attachment
        }
      }

      // Process terms and conditions PDF with similar chunking if URL is provided
      if (termsAndConditionsUrl) {
        try {
          console.log(`Fetching terms PDF from: ${termsAndConditionsUrl}`);
          
          const fetchUrl = termsAndConditionsUrl.startsWith('http') ? termsAndConditionsUrl : `https://${termsAndConditionsUrl}`;
          
          const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/pdf',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (!response.ok) {
            console.error(`Failed to fetch terms PDF: ${response.status} ${response.statusText}`);
          } else {
            console.log("Terms PDF fetched successfully");
            const arrayBuffer = await response.arrayBuffer();
            const termsData = new Uint8Array(arrayBuffer);
            
            // Process in smaller chunks
            const chunkSize = 512 * 1024; // 512KB chunks
            const chunks = [];
            for (let i = 0; i < termsData.length; i += chunkSize) {
              chunks.push(termsData.slice(i, i + chunkSize));
            }
            
            const processedTerms = new Uint8Array(termsData.length);
            let offset = 0;
            for (const chunk of chunks) {
              processedTerms.set(chunk, offset);
              offset += chunk.length;
            }
            
            attachments.push({
              filename: "terms-and-conditions.pdf",
              content: processedTerms
            });
            console.log("Terms and conditions PDF successfully added to attachments");
          }
        } catch (error) {
          console.error("Error processing terms PDF:", error);
        }
      }
    }

    console.log(`Ready to send email with ${attachments.length} attachments`);
    
    // Prepare the email HTML content
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Invoice #${invoiceNumber}</h2>
        <p>Dear ${clientName},</p>
        <p>Please find your invoice #${invoiceNumber}${includeAttachments && attachments.length > 0 ? ' attached' : ' available in your account'}.</p>
        ${includeAttachments && attachments.length > 1 ? '<p>We have also attached our terms and conditions for your reference.</p>' : ''}
        ${(!includeAttachments || attachments.length === 0) && pdfUrl ? `<p><a href="${pdfUrl}" target="_blank">Click here to view your invoice</a></p>` : ''}
        <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
        <p>Best regards,<br>${companyName || "PowerPeppol"}</p>
      </div>
    `;
    
    // Configure email
    const emailConfig = {
      from: `${companyName || "PowerPeppol"} <info@powerpeppol.com>`,
      to: [clientEmail],
      subject: `Invoice #${invoiceNumber}`,
      html: emailHtml
    };
    
    // Only add attachments if we have any
    if (attachments.length > 0) {
      console.log(`Adding ${attachments.length} attachments to email`);
      Object.assign(emailConfig, { attachments });
    } else {
      console.log("No attachments to add to email");
    }
    
    console.log("Sending email via Resend with config:", {
      from: emailConfig.from,
      to: emailConfig.to,
      subject: emailConfig.subject,
      attachmentsCount: attachments.length
    });
    
    let emailResponse;
    try {
      // Send the email with Resend
      emailResponse = await resend.emails.send(emailConfig);
      console.log("Email sent successfully:", emailResponse);
    } catch (emailError: any) {
      console.error("Resend API error:", emailError);
      
      // If attachments are causing problems, try again without them
      if (attachments.length > 0) {
        console.log("Trying to send email without attachments as fallback");
        
        // Configure fallback email without attachments
        const fallbackConfig = {
          from: emailConfig.from,
          to: emailConfig.to,
          subject: emailConfig.subject,
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
          `
        };
        
        try {
          // Try sending the email without attachments
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
