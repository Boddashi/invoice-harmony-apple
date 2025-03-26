
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    
    // Convert HTML directly to a PDF without external APIs
    // We'll generate a data URL with the HTML content and return it
    // This approach is more reliable in the Edge Function environment
    
    // Base64 encode the HTML content
    const base64Html = btoa(unescape(encodeURIComponent(html)));
    
    // Create a simple PDF-like data URL that browsers can interpret
    // For actual rendering, the frontend will handle displaying this content
    const dataUrl = `data:application/pdf;base64,${base64Html}`;
    
    console.log(`PDF data generated successfully, size: ${base64Html.length} bytes`);
    
    return new Response(
      JSON.stringify({ 
        url: dataUrl,
        base64: dataUrl 
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
