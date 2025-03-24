
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STORECOVE_API_KEY = Deno.env.get('STORECOVE_API_KEY');
    
    if (!STORECOVE_API_KEY) {
      console.error("Missing Storecove API key in environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get the request body
    const requestData = await req.json();
    const { companySettings } = requestData;

    console.log("Received company settings:", JSON.stringify(companySettings));

    if (!companySettings) {
      return new Response(
        JSON.stringify({ error: "Missing company settings data" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Format data for Storecove API
    const legalEntityData = {
      acts_as_receiver: true,
      acts_as_sender: true,
      advertisements: ["invoice"],
      city: companySettings.city || "",
      country: companySettings.country || "",
      county: "", // This field isn't in our settings, leaving it empty
      line1: `${companySettings.street || ""} ${companySettings.number || ""}`,
      line2: companySettings.bus || "",
      party_name: companySettings.company_name || "",
      public: true,
      tax_registered: true,
      zip: companySettings.postal_code || ""
    };

    console.log("Preparing legal entity payload:", JSON.stringify(legalEntityData));

    // Make request to Storecove API
    const response = await fetch("https://api.storecove.com/api/v2/legal_entities", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${STORECOVE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(legalEntityData)
    });

    const responseData = await response.json();
    
    // Check if the request was successful
    if (!response.ok) {
      console.error("Storecove API error:", JSON.stringify(responseData));
      return new Response(
        JSON.stringify({ 
          error: "Failed to create legal entity", 
          details: responseData 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Successfully created legal entity:", JSON.stringify(responseData));

    // Return the response from Storecove
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: responseData 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in create-legal-entity function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
