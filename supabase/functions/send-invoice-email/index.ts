
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
      includeAttachments = false // Default to false to reduce memory usage
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
    
    if (includeAttachments && pdfUrl) {
      try {
        console.log(`Will include PDF as a link instead of attachment to reduce memory usage`);
      } catch (error) {
        console.error("Error processing invoice PDF:", error);
      }
    }

    console.log(`Ready to send email with ${attachments.length} attachments`);
    
    // Prepare the email HTML content with links instead of attachments
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Invoice #${invoiceNumber}</h2>
        <p>Dear ${clientName},</p>
        <p>Your invoice #${invoiceNumber} is now available.</p>
        ${pdfUrl ? `<p><a href="${pdfUrl}" target="_blank" style="display: inline-block; background-color: #4F46E5; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; margin-top: 10px;">View Invoice</a></p>` : ''}
        ${termsAndConditionsUrl ? `<p><a href="${termsAndConditionsUrl}" target="_blank">Terms and Conditions</a></p>` : ''}
        <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
        <p>Best regards,<br>${companyName || "PowerPeppol"}</p>
      </div>
    `;
    
    // Configure email - without attachments to reduce memory usage
    const emailConfig = {
      from: `${companyName || "PowerPeppol"} <info@powerpeppol.com>`,
      to: [clientEmail],
      subject: `Invoice #${invoiceNumber}`,
      html: emailHtml
    };
    
    console.log("Sending email via Resend with config:", {
      from: emailConfig.from,
      to: emailConfig.to,
      subject: emailConfig.subject,
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
