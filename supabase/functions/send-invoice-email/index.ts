
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
  pdfUrl: string;
  termsAndConditionsUrl?: string;
  companyName: string;
  includeAttachments: boolean;
  pdfBase64?: string;
  yukiEmail?: string;
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
      includeAttachments = true,
      pdfBase64,
      yukiEmail
    }: SendInvoiceEmailRequest = requestData;

    if (!clientEmail) {
      console.error("Client email is required but was not provided");
      throw new Error("Client email is required");
    }

    console.log(`Sending invoice email to ${clientEmail}`);
    if (yukiEmail) {
      console.log(`Also sending copy to Yuki email: ${yukiEmail}`);
    }
    console.log(`Include attachments: ${includeAttachments}`);
    
    const attachments = [];
    
    if (includeAttachments && pdfUrl) {
      try {
        console.log("Attempting to attach PDF document");
        
        if (pdfBase64) {
          console.log("Using provided PDF base64 data");
          
          // Extract the base64 data (remove data:application/pdf;base64, prefix if present)
          const base64Data = pdfBase64.includes("base64,") 
            ? pdfBase64.split("base64,")[1]
            : pdfBase64;
          
          // Add the PDF as an attachment
          attachments.push({
            filename: `invoice-${invoiceNumber}.pdf`,
            content: base64Data,
          });
          
          console.log("PDF attachment added successfully");
        } else if (pdfUrl) {
          console.log(`Fetching PDF from URL: ${pdfUrl}`);
          const pdfResponse = await fetch(pdfUrl);
          
          if (!pdfResponse.ok) {
            throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
          }
          
          const pdfBuffer = await pdfResponse.arrayBuffer();
          const pdfBase64 = btoa(
            String.fromCharCode(...new Uint8Array(pdfBuffer))
          );
          
          attachments.push({
            filename: `invoice-${invoiceNumber}.pdf`,
            content: pdfBase64,
          });
          
          console.log("PDF fetched and attached successfully");
        }
        
        // Add terms and conditions if available
        if (termsAndConditionsUrl) {
          console.log(`Fetching Terms and Conditions from URL: ${termsAndConditionsUrl}`);
          try {
            const termsResponse = await fetch(termsAndConditionsUrl);
            
            if (termsResponse.ok) {
              const termsBuffer = await termsResponse.arrayBuffer();
              const termsBase64 = btoa(
                String.fromCharCode(...new Uint8Array(termsBuffer))
              );
              
              attachments.push({
                filename: "terms-and-conditions.pdf",
                content: termsBase64,
              });
              
              console.log("Terms and Conditions attached successfully");
            } else {
              console.warn(`Could not fetch Terms and Conditions: ${termsResponse.status}`);
            }
          } catch (termsError) {
            console.warn("Error attaching Terms and Conditions:", termsError);
          }
        }
      } catch (error) {
        console.error("Error processing attachments:", error);
        // Continue sending the email without attachments if there's an error
      }
    }

    console.log(`Ready to send email with ${attachments.length} attachments`);
    
    // Prepare the email HTML content
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Invoice #${invoiceNumber}</h2>
        <p>Dear ${clientName},</p>
        <p>Your invoice #${invoiceNumber} is now available.</p>
        <p>Please find the attached invoice PDF for your records.</p>
        <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
        <p>Best regards,<br>${companyName || "PowerPeppol"}</p>
      </div>
    `;
    
    // Configure email recipients
    const recipients = [clientEmail];
    if (yukiEmail) {
      recipients.push(yukiEmail);
    }
    
    // Configure email with attachments
    const emailConfig = {
      from: `${companyName || "PowerPeppol"} <info@powerpeppol.com>`,
      to: recipients,
      subject: `Invoice #${invoiceNumber}`,
      html: emailHtml,
      attachments: attachments.length > 0 ? attachments : undefined
    };
    
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
      throw emailError;
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
