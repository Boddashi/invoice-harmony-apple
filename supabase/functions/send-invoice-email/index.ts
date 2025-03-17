
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
    
    const { clientName, clientEmail, invoiceNumber, pdfUrl, termsAndConditionsUrl, companyName }: SendInvoiceEmailRequest = requestData;

    if (!clientEmail) {
      console.error("Client email is required but was not provided");
      throw new Error("Client email is required");
    }

    if (!pdfUrl) {
      console.error("PDF URL is required but was not provided");
      throw new Error("PDF URL is required");
    }

    console.log(`Sending invoice email to ${clientEmail}`);
    console.log(`PDF URL: ${pdfUrl}`);
    
    // Fetch the PDF content to attach to the email
    console.log("Fetching PDF content...");
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      console.error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
    }
    
    // Get the PDF as an array buffer and convert to base64 safely
    const pdfBuffer = await pdfResponse.arrayBuffer();
    // Use a more efficient way to encode to base64
    const pdfBase64 = btoa(
      new Uint8Array(pdfBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    console.log("PDF content fetched and encoded successfully");

    const attachments = [
      {
        content: pdfBase64,
        filename: `invoice-${invoiceNumber}.pdf`,
        type: "application/pdf",
      },
    ];

    // Add Terms and Conditions if available
    if (termsAndConditionsUrl) {
      try {
        console.log("Fetching terms and conditions...");
        const termsResponse = await fetch(termsAndConditionsUrl);
        if (termsResponse.ok) {
          const termsBuffer = await termsResponse.arrayBuffer();
          // Use same efficient encoding method
          const termsBase64 = btoa(
            new Uint8Array(termsBuffer)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
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
          <p>Please find attached your invoice #${invoiceNumber}.</p>
          ${termsAndConditionsUrl ? '<p>We have also attached our terms and conditions for your reference.</p>' : ''}
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
