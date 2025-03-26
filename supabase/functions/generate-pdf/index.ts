
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import chromium from "https://deno.land/x/puppeteer_plus@0.14.1/vendor/puppeteer-core/puppeteer/node/chromium.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { html, filename } = await req.json();
    
    if (!html) {
      return new Response(
        JSON.stringify({ error: "HTML content is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log(`Starting PDF generation for: ${filename || 'unnamed document'}`);
    
    // Use a simple HTML to PDF conversion approach compatible with edge functions
    // Since we can't use Puppeteer directly in this environment, we'll use a more
    // basic approach to convert HTML to PDF data
    const pdfResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa('api:free')  // Using PDFShift's free tier for basic conversion
      },
      body: JSON.stringify({
        source: html,
        landscape: false,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      })
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      throw new Error(`PDF generation API error: ${pdfResponse.status} ${errorText}`);
    }

    // Convert the PDF to base64
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
    
    console.log(`PDF generated successfully, size: ${base64Data.length} bytes`);
    
    return new Response(
      JSON.stringify({ 
        url: `data:application/pdf;base64,${base64Data}`,
        base64: `data:application/pdf;base64,${base64Data}` 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate PDF" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
