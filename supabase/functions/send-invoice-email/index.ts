import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@1.1.0";

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
    console.log("Received request to send invoice/credit note email");
    
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error("Missing Resend API key");
    }

    const resend = new Resend(RESEND_API_KEY);
    
    const data = await req.json();
    
    const {
      clientName,
      clientEmail,
      invoiceNumber,
      pdfUrl,
      termsAndConditionsUrl,
      companyName = "PowerPeppol",
      includeAttachments = true,
      pdfBase64,
      yukiEmail,
      isCreditNote = false,
      forceYukiCopy = false
    } = data;
    
    const documentType = isCreditNote ? "Credit Note" : "Invoice";
    
    // Log received data (being careful not to log huge PDF data)
    console.log("Request data:", {
      clientName,
      clientEmail,
      invoiceNumber,
      pdfUrl,
      hasTermsUrl: !!termsAndConditionsUrl,
      companyName,
      includeAttachments,
      hasPdfData: !!pdfBase64,
      pdfDataLength: pdfBase64 ? pdfBase64.length : 0,
      yukiEmail,
      isCreditNote
    });
    
    if (!clientName || !clientEmail || !invoiceNumber) {
      throw new Error("Missing required parameters");
    }
    
    console.log(`Sending ${documentType.toLowerCase()} email to ${clientEmail}`);
    
    // If yukiEmail is provided, add it to recipients
    const recipients = [clientEmail];
    if (yukiEmail) {
      console.log(`Also sending copy to Yuki email: ${yukiEmail}`);
      recipients.push(yukiEmail);
    }
    
    console.log(`Include attachments: ${includeAttachments}`);
    
    const attachments = [];
    
    // Attempt to add PDF attachment
    if (includeAttachments) {
      console.log("Attempting to attach PDF document");
      
      if (pdfBase64) {
        console.log("Using provided PDF base64 data");
        try {
          // Fix: Extract the base64 data correctly, removing the data URL prefix if present
          const base64Content = pdfBase64.includes("base64,") 
            ? pdfBase64.split("base64,")[1] 
            : pdfBase64;
          
          attachments.push({
            filename: isCreditNote ? `credit-note-${invoiceNumber}.pdf` : `invoice-${invoiceNumber}.pdf`,
            content: base64Content,
            type: "application/pdf" // Explicitly set the content type to PDF
          });
          console.log("PDF attachment added successfully");
        } catch (err) {
          console.error("Error adding PDF attachment:", err);
        }
      } else if (pdfUrl) {
        console.log("Using PDF URL to download content:", pdfUrl);
        try {
          const pdfResponse = await fetch(pdfUrl);
          if (pdfResponse.ok) {
            const pdfBuffer = await pdfResponse.arrayBuffer();
            const pdfBase64String = btoa(
              String.fromCharCode(...new Uint8Array(pdfBuffer))
            );
            
            attachments.push({
              filename: isCreditNote ? `credit-note-${invoiceNumber}.pdf` : `invoice-${invoiceNumber}.pdf`,
              content: pdfBase64String,
              type: "application/pdf" // Explicitly set the content type to PDF
            });
            console.log("PDF downloaded and attached successfully");
          } else {
            console.error("Failed to download PDF from URL:", pdfResponse.status);
          }
        } catch (err) {
          console.error("Error downloading PDF from URL:", err);
        }
      }
      
      // Attempt to add Terms & Conditions if URL is provided
      if (termsAndConditionsUrl) {
        console.log("Fetching Terms and Conditions from URL:", termsAndConditionsUrl);
        try {
          const termsResponse = await fetch(termsAndConditionsUrl);
          
          if (termsResponse.ok) {
            const termsBuffer = await termsResponse.arrayBuffer();
            
            // Check if Terms & Conditions file is under 10MB
            if (termsBuffer.byteLength <= 10 * 1024 * 1024) {
              const termsBase64 = btoa(
                String.fromCharCode(...new Uint8Array(termsBuffer))
              );
              
              attachments.push({
                filename: "terms-and-conditions.pdf",
                content: termsBase64,
                type: "application/pdf" // Explicitly set the content type to PDF
              });
              console.log("Terms and Conditions attached successfully");
            } else {
              console.log("Terms & Conditions file exceeds 10MB, not attaching");
            }
          } else {
            console.error("Failed to fetch Terms & Conditions:", termsResponse.status);
          }
        } catch (err) {
          console.error("Error attaching Terms & Conditions:", err);
        }
      }
    }
    
    console.log(`Ready to send email with ${attachments.length} attachments`);
    
    // Set up email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Dear ${clientName},</p>
        
        <p>Please find attached your ${documentType.toLowerCase()} ${invoiceNumber} from ${companyName}.</p>
        
        ${isCreditNote ? 
          `<p>This credit note has been processed in relation to a previous invoice.</p>` : 
          `<p>For your convenience, payment details are included in the invoice.</p>`
        }
        
        ${termsAndConditionsUrl ? 
          `<p>Our terms and conditions are attached to this email for your reference.</p>` : 
          ``
        }
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Thank you for your business.</p>
        
        <p>Best regards,<br>${companyName}</p>
      </div>
    `;
    
    // Log email configuration
    console.log("Sending email via Resend with config:", {
      from: `${companyName} <info@powerpeppol.com>`,
      to: recipients,
      subject: `${documentType} #${invoiceNumber}`,
      attachmentsCount: attachments.length
    });
    
    // Send the email
    const emailResult = await resend.emails.send({
      from: `${companyName} <info@powerpeppol.com>`,
      to: recipients,
      subject: `${documentType} #${invoiceNumber}`,
      html: htmlContent,
      attachments: attachments
    });
    
    console.log("Email sent successfully:", JSON.stringify(emailResult));
    
    return new Response(
      JSON.stringify({ success: true, data: emailResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending email:", error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
