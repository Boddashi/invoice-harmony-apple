
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderEmailRequest {
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  dueDate: string;
  amount: number;
  currencySymbol: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, clientEmail, invoiceNumber, dueDate, amount, currencySymbol }: ReminderEmailRequest = await req.json();

    const formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedAmount = `${currencySymbol}${amount.toFixed(2)}`;

    const emailResponse = await resend.emails.send({
      from: "PowerPeppol <info@powerpeppol.com>",
      to: [clientEmail],
      subject: `Overdue Invoice Reminder - Invoice #${invoiceNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Invoice Payment Reminder</h2>
          <p>Dear ${clientName},</p>
          <p>This is a friendly reminder that invoice #${invoiceNumber} was due on ${formattedDueDate}.</p>
          <p>Outstanding amount: ${formattedAmount}</p>
          <p>Please process this payment at your earliest convenience.</p>
          <p>If you have already made the payment, please disregard this reminder.</p>
          <p>Best regards,<br>PowerPeppol</p>
        </div>
      `,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending reminder email:", error);
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
