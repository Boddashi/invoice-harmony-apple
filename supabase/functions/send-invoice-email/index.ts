
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
    const { clientName, clientEmail, invoiceNumber, pdfUrl, termsAndConditionsUrl, companyName }: SendInvoiceEmailRequest = await req.json();

    if (!clientEmail) {
      throw new Error("Client email is required");
    }

    console.log(`Sending invoice email to ${clientEmail}`);

    // Fetch the PDF content to attach to the email
    const pdfResponse = await fetch(pdfUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

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
        const termsResponse = await fetch(termsAndConditionsUrl);
        const termsBuffer = await termsResponse.arrayBuffer();
        const termsBase64 = btoa(String.fromCharCode(...new Uint8Array(termsBuffer)));
        
        attachments.push({
          content: termsBase64,
          filename: "terms-and-conditions.pdf",
          type: "application/pdf",
        });
      } catch (error) {
        console.error("Error attaching terms and conditions:", error);
        // Continue without the terms attachment if there's an error
      }
    }

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
