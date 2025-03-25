
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
    const { client } = requestData;

    console.log("Received client data:", JSON.stringify(client));

    if (!client) {
      return new Response(JSON.stringify({ error: "Missing client data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate required fields for legal entity creation
    if (
      !client.name ||
      !client.city ||
      !client.country ||
      !client.street ||
      !client.postcode
    ) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          requiredFields: ["name", "city", "country", "street", "postcode"],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Format data for Storecove API
    const legalEntityData = {
      acts_as_receiver: true,
      acts_as_sender: false, // Setting this to false as clients are only receivers
      advertisements: ["invoice"],
      city: client.city || "",
      country: client.country || "",
      county: "", // This field isn't in our settings, leaving it empty
      line1: `${client.street || ""} ${client.number || ""}`,
      line2: client.bus || "",
      party_name: client.name || "",
      public: true,
      tax_registered: client.type === "business" && !!client.vatNumber,
      zip: client.postcode || "",
    };

    console.log(
      "Preparing legal entity payload:",
      JSON.stringify(legalEntityData)
    );

    // Make request to Storecove API to create legal entity
    const response = await fetch(
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

    const responseData = await response.json();

    // Check if the request was successful
    if (!response.ok) {
      console.error("Storecove API error:", JSON.stringify(responseData));
      return new Response(
        JSON.stringify({
          error: "Failed to create legal entity",
          details: responseData,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      "Successfully created legal entity:",
      JSON.stringify(responseData)
    );

    // Extract the legal entity ID from the response
    const legalEntityId = responseData.id;
    let peppolData = null;

    // If we have a legal entity ID and VAT number, create PEPPOL identifier
    if (
      legalEntityId &&
      client.vatNumber &&
      client.country &&
      client.type === "business"
    ) {
      try {
        console.log(
          "Creating PEPPOL identifier for legal entity ID:",
          legalEntityId
        );

        // Format the scheme based on country and VAT
        const countryCode = client.country;
        const scheme = `${countryCode}:VAT`;

        // Prepare PEPPOL identifier payload
        const peppolPayload = {
          identifier: client.vatNumber,
          scheme: scheme,
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
    console.error("Error in create-client-legal-entity function:", error);

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

