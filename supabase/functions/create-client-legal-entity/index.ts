
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

    let response;
    let responseData;

    // Check if we have an existing legal entity ID
    if (client.legal_entity_id) {
      console.log(
        "Updating existing legal entity with ID:",
        client.legal_entity_id
      );
      console.log("Update payload:", JSON.stringify(legalEntityData));

      // Make PATCH request to Storecove API to update legal entity
      response = await fetch(
        `https://api.storecove.com/api/v2/legal_entities/${client.legal_entity_id}`,
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
      
      responseData = await response.json();
      
      if (!response.ok) {
        console.error("Error updating legal entity:", JSON.stringify(responseData));
        return new Response(
          JSON.stringify({
            error: "Failed to update legal entity",
            details: responseData,
          }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      console.log("Successfully updated legal entity:", JSON.stringify(responseData));
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
      
      responseData = await response.json();

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
    }

    // Extract the legal entity ID from the response
    const legalEntityId = responseData.id;
    let peppolData = null;

    // If we have a legal entity ID and VAT number, handle PEPPOL identifier
    if (
      legalEntityId &&
      client.vatNumber &&
      client.country &&
      client.type === "business"
    ) {
      try {
        console.log(
          "Handling PEPPOL identifier for legal entity ID:",
          legalEntityId
        );

        // First, check if we need to delete an existing PEPPOL identifier
        if (client.legal_entity_id) {
          try {
            // Fetch the legal entity details to get current PEPPOL identifiers
            console.log("Fetching legal entity details to check PEPPOL identifiers");
            const legalEntityResponse = await fetch(
              `https://api.storecove.com/api/v2/legal_entities/${legalEntityId}`,
              {
                method: "GET",
                headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${STORECOVE_API_KEY}`,
                },
              }
            );
            
            const legalEntityDetails = await legalEntityResponse.json();
            console.log("Legal entity details:", JSON.stringify(legalEntityDetails));
            
            if (legalEntityDetails.peppol_identifiers && legalEntityDetails.peppol_identifiers.length > 0) {
              for (const peppol of legalEntityDetails.peppol_identifiers) {
                console.log("Found existing PEPPOL identifier:", JSON.stringify(peppol));
                
                // Delete the existing PEPPOL identifier
                console.log(`Deleting PEPPOL identifier: superscheme=${peppol.superscheme}, scheme=${peppol.scheme}, identifier=${peppol.identifier}`);
                
                const deleteResponse = await fetch(
                  `https://api.storecove.com/api/v2/legal_entities/${legalEntityId}/peppol_identifiers/${encodeURIComponent(peppol.superscheme)}/${encodeURIComponent(peppol.scheme)}/${encodeURIComponent(peppol.identifier)}`,
                  {
                    method: "DELETE",
                    headers: {
                      Accept: "application/json",
                      Authorization: `Bearer ${STORECOVE_API_KEY}`,
                    },
                  }
                );
                
                if (!deleteResponse.ok) {
                  const deleteError = await deleteResponse.text();
                  console.error(`Error deleting PEPPOL identifier: ${deleteError}`);
                  console.log("Will continue with creating new identifier");
                } else {
                  console.log("Successfully deleted PEPPOL identifier");
                }
              }
            } else {
              console.log("No existing PEPPOL identifiers found");
            }
          } catch (fetchError) {
            console.error("Error fetching or deleting PEPPOL identifiers:", fetchError);
            console.log("Will continue with creating new identifier");
          }
        }

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
          "Creating new PEPPOL identifier payload:",
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
              data: peppolData,  // Return the complete PEPPOL data object with scheme and identifier
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
