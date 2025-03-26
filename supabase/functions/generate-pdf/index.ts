
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

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
    
    // Launch headless browser - fixed the import issue
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    
    try {
      // Create a new page
      const page = await browser.newPage();
      
      // Set content to the provided HTML
      await page.setContent(html, { waitUntil: "networkidle0" });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
      });
      
      // Convert buffer to base64
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
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate PDF" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
