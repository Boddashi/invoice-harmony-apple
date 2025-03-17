
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
    if (termsAndConditionsUrl) {
      console.log(`Terms and conditions URL: ${termsAndConditionsUrl}`);
    }

    // Fetch the PDF content to attach to the email
    console.log("Fetching PDF content...");
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      console.error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
    }
    
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
    console.log("PDF content fetched successfully");

    let attachments = [
      {
        content: pdfBase64,
        filename: `invoice-${invoiceNumber}.pdf`,
        type: "application/pdf",
      },
    ];

    // If terms and conditions URL is provided, fetch and attach it as well
    if (termsAndConditionsUrl) {
      try {
        console.log("Fetching terms and conditions...");
        const termsResponse = await fetch(termsAndConditionsUrl);
        if (!termsResponse.ok) {
          console.error(`Failed to fetch terms and conditions: ${termsResponse.status} ${termsResponse.statusText}`);
          // Continue without terms, but log the error
        } else {
          const termsBuffer = await termsResponse.arrayBuffer();
          const termsBase64 = btoa(String.fromCharCode(...new Uint8Array(termsBuffer)));
          console.log("Terms and conditions fetched successfully");
          
          attachments.push({
            content: termsBase64,
            filename: "terms-and-conditions.pdf",
            type: "application/pdf",
          });
        }
      } catch (error) {
        console.error("Error attaching terms and conditions:", error);
        // Continue without the terms attachment if there's an error
      }
    }

    console.log("Sending email via Resend...");
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
