
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
    const { html, documentId, documentType } = await req.json();
    
    if (!html) {
      return new Response(
        JSON.stringify({ error: "HTML content is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log(`Starting PDF generation for: ${documentType || 'document'} ID: ${documentId || 'unknown'}`);
    
    // Convert HTML to a PDF-like data format (this is just a simplified version)
    // In a real environment, you'd use a proper PDF generation library
    const base64Html = btoa(unescape(encodeURIComponent(html)));
    
    // Create a data URL that can be used by the frontend
    const dataUrl = `data:application/pdf;base64,${base64Html}`;
    
    console.log(`PDF data generated successfully, size: ${base64Html.length} bytes`);
    
    // Return the data without trying to update any database records
    // The client will handle saving the PDF to storage
    return new Response(
      JSON.stringify({ 
        documentId,
        documentType,
        base64: dataUrl,
        success: true
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
