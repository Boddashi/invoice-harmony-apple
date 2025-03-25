
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STORECOVE_API_KEY = Deno.env.get("STORECOVE_API_KEY");

    if (!STORECOVE_API_KEY) {
      console.error("Missing Storecove API key in environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      zip: companySettings.postal_code || "",
    };

    let response;
    let responseData;

    // Check if we have an existing legal entity ID
    if (companySettings.legal_entity_id) {
      console.log(
        "Updating existing legal entity with ID:",
        companySettings.legal_entity_id
      );
      console.log("Update payload:", JSON.stringify(legalEntityData));

      // Make PATCH request to Storecove API to update legal entity
      response = await fetch(
        `https://api.storecove.com/api/v2/legal_entities/${companySettings.legal_entity_id}`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${STORECOVE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(legalEntityData),
        }
      );
    } else {
      console.log(
        "Creating new legal entity with payload:",
        JSON.stringify(legalEntityData)
      );

      // Make request to Storecove API to create legal entity
      response = await fetch(
        "https://api.storecove.com/api/v2/legal_entities",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${STORECOVE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(legalEntityData),
        }
      );
    }

    responseData = await response.json();

    // Check if the request was successful
    if (!response.ok) {
      console.error("Storecove API error:", JSON.stringify(responseData));
      return new Response(
        JSON.stringify({
          error: "Failed to create or update legal entity",
          details: responseData,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      "Successfully created or updated legal entity:",
      JSON.stringify(responseData)
    );

    // Extract the legal entity ID from the response
    const legalEntityId = responseData.id;
    let peppolData = null;

    // If we have a legal entity ID and VAT number, create PEPPOL identifier
    if (
      legalEntityId &&
      companySettings.vat_number &&
      companySettings.country
    ) {
      try {
        console.log(
          "Creating PEPPOL identifier for legal entity ID:",
          legalEntityId
        );

        // Format the scheme based on country and VAT
        const countryCode = companySettings.country;

        // Prepare PEPPOL identifier payload
        const peppolPayload = {
          identifier: companySettings.vat_number,
          scheme: `${countryCode}:VAT`,
          superscheme: "iso6523-actorid-upis",
        };

        console.log(
          "PEPPOL identifier payload:",
          JSON.stringify(peppolPayload)
        );

        // Make request to create PEPPOL identifier
        const peppolResponse = await fetch(
          `https://api.storecove.com/api/v2/legal_entities/${legalEntityId}/peppol_identifiers`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${STORECOVE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(peppolPayload),
          }
        );

        peppolData = await peppolResponse.json();

        if (!peppolResponse.ok) {
          console.error(
            "Error creating PEPPOL identifier:",
            JSON.stringify(peppolData)
          );

          // We don't fail the entire operation if PEPPOL creation fails
          return new Response(
            JSON.stringify({
              success: true,
              data: responseData,
              peppol: {
                success: false,
                error: peppolData,
              },
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        console.log(
          "Successfully created PEPPOL identifier:",
          JSON.stringify(peppolData)
        );

        // Return success with both legal entity and PEPPOL data
        return new Response(
          JSON.stringify({
            success: true,
            data: responseData,
            peppol: {
              success: true,
              data: peppolData,
            },
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (peppolError) {
        console.error("Exception creating PEPPOL identifier:", peppolError);

        // Return success for legal entity but error for PEPPOL
        return new Response(
          JSON.stringify({
            success: true,
            data: responseData,
            peppol: {
              success: false,
              error: peppolError.message,
            },
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Return the legal entity data if we didn't create a PEPPOL identifier
    return new Response(
      JSON.stringify({
        success: true,
        data: responseData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in create-legal-entity function:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
