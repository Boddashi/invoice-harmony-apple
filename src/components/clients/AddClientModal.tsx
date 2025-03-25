import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";

interface Client {
  id?: string;
  type: string;
  name: string;
  email: string;
  phone?: string | null;
  street?: string | null;
  number?: string | null;
  bus?: string | null;
  postcode?: string | null;
  city?: string | null;
  country?: string;
  vatNumber?: string | null;
  vat_number?: string | null;
  legal_entity_id?: number | null;
  peppol_identifier?: any | null;
}

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (client: any) => void;
  onUpdateClient?: (client: any) => void;
  clientToEdit?: Client | null;
}

const AddClientModal = ({
  isOpen,
  onClose,
  onAddClient,
  onUpdateClient,
  clientToEdit,
}: AddClientModalProps) => {
  const { toast } = useToast();
  const isEditMode = !!clientToEdit;
  const [isCreatingLegalEntity, setIsCreatingLegalEntity] = useState(false);

  const [formData, setFormData] = useState({
    type: "business",
    name: "",
    email: "",
    phone: "",
    street: "",
    number: "",
    bus: "",
    postcode: "",
    city: "",
    country: "BE",
    vatNumber: "",
  });

  const countries = [
    { code: "AF", name: "Afghanistan" },
    { code: "AL", name: "Albania" },
    { code: "DZ", name: "Algeria" },
    { code: "AD", name: "Andorra" },
    { code: "AO", name: "Angola" },
    { code: "AG", name: "Antigua and Barbuda" },
    { code: "AR", name: "Argentina" },
    { code: "AM", name: "Armenia" },
    { code: "AU", name: "Australia" },
    { code: "AT", name: "Austria" },
    { code: "AZ", name: "Azerbaijan" },
    { code: "BS", name: "Bahamas" },
    { code: "BH", name: "Bahrain" },
    { code: "BD", name: "Bangladesh" },
    { code: "BB", name: "Barbados" },
    { code: "BY", name: "Belarus" },
    { code: "BE", name: "Belgium" },
    { code: "BZ", name: "Belize" },
    { code: "BJ", name: "Benin" },
    { code: "BT", name: "Bhutan" },
    { code: "BO", name: "Bolivia" },
    { code: "BA", name: "Bosnia and Herzegovina" },
    { code: "BW", name: "Botswana" },
    { code: "BR", name: "Brazil" },
    { code: "BN", name: "Brunei" },
    { code: "BG", name: "Bulgaria" },
    { code: "BF", name: "Burkina Faso" },
    { code: "BI", name: "Burundi" },
    { code: "CV", name: "Cabo Verde" },
    { code: "KH", name: "Cambodia" },
    { code: "CM", name: "Cameroon" },
    { code: "CA", name: "Canada" },
    { code: "CF", name: "Central African Republic" },
    { code: "TD", name: "Chad" },
    { code: "CL", name: "Chile" },
    { code: "CN", name: "China" },
    { code: "CO", name: "Colombia" },
    { code: "KM", name: "Comoros" },
    { code: "CG", name: "Congo" },
    { code: "CR", name: "Costa Rica" },
    { code: "HR", name: "Croatia" },
    { code: "CU", name: "Cuba" },
    { code: "CY", name: "Cyprus" },
    { code: "CZ", name: "Czech Republic" },
    { code: "DK", name: "Denmark" },
    { code: "DJ", name: "Djibouti" },
    { code: "DM", name: "Dominica" },
    { code: "DO", name: "Dominican Republic" },
    { code: "EC", name: "Ecuador" },
    { code: "EG", name: "Egypt" },
    { code: "SV", name: "El Salvador" },
    { code: "GQ", name: "Equatorial Guinea" },
    { code: "ER", name: "Eritrea" },
    { code: "EE", name: "Estonia" },
    { code: "ET", name: "Ethiopia" },
    { code: "FJ", name: "Fiji" },
    { code: "FI", name: "Finland" },
    { code: "FR", name: "France" },
    { code: "GA", name: "Gabon" },
    { code: "GM", name: "Gambia" },
    { code: "GE", name: "Georgia" },
    { code: "DE", name: "Germany" },
    { code: "GH", name: "Ghana" },
    { code: "GR", name: "Greece" },
    { code: "GD", name: "Grenada" },
    { code: "GT", name: "Guatemala" },
    { code: "GN", name: "Guinea" },
    { code: "GW", name: "Guinea-Bissau" },
    { code: "GY", name: "Guyana" },
    { code: "HT", name: "Haiti" },
    { code: "HN", name: "Honduras" },
    { code: "HU", name: "Hungary" },
    { code: "IS", name: "Iceland" },
    { code: "IN", name: "India" },
    { code: "ID", name: "Indonesia" },
    { code: "IR", name: "Iran" },
    { code: "IQ", name: "Iraq" },
    { code: "IE", name: "Ireland" },
    { code: "IL", name: "Israel" },
    { code: "IT", name: "Italy" },
    { code: "JM", name: "Jamaica" },
    { code: "JP", name: "Japan" },
    { code: "JO", name: "Jordan" },
    { code: "KZ", name: "Kazakhstan" },
    { code: "KE", name: "Kenya" },
    { code: "KI", name: "Kiribati" },
    { code: "KP", name: "North Korea" },
    { code: "KR", name: "South Korea" },
    { code: "KW", name: "Kuwait" },
    { code: "KG", name: "Kyrgyzstan" },
    { code: "LA", name: "Laos" },
    { code: "LV", name: "Latvia" },
    { code: "LB", name: "Lebanon" },
    { code: "LS", name: "Lesotho" },
    { code: "LR", name: "Liberia" },
    { code: "LY", name: "Libya" },
    { code: "LI", name: "Liechtenstein" },
    { code: "LT", name: "Lithuania" },
    { code: "LU", name: "Luxembourg" },
    { code: "MG", name: "Madagascar" },
    { code: "MW", name: "Malawi" },
    { code: "MY", name: "Malaysia" },
    { code: "MV", name: "Maldives" },
    { code: "ML", name: "Mali" },
    { code: "MT", name: "Malta" },
    { code: "MH", name: "Marshall Islands" },
    { code: "MR", name: "Mauritania" },
    { code: "MU", name: "Mauritius" },
    { code: "MX", name: "Mexico" },
    { code: "FM", name: "Micronesia" },
    { code: "MD", name: "Moldova" },
    { code: "MC", name: "Monaco" },
    { code: "MN", name: "Mongolia" },
    { code: "ME", name: "Montenegro" },
    { code: "MA", name: "Morocco" },
    { code: "MZ", name: "Mozambique" },
    { code: "MM", name: "Myanmar" },
    { code: "NA", name: "Namibia" },
    { code: "NR", name: "Nauru" },
    { code: "NP", name: "Nepal" },
    { code: "NL", name: "Netherlands" },
    { code: "NZ", name: "New Zealand" },
    { code: "NI", name: "Nicaragua" },
    { code: "NE", name: "Niger" },
    { code: "NG", name: "Nigeria" },
    { code: "NO", name: "Norway" },
    { code: "OM", name: "Oman" },
    { code: "PK", name: "Pakistan" },
    { code: "PW", name: "Palau" },
    { code: "PA", name: "Panama" },
    { code: "PG", name: "Papua New Guinea" },
    { code: "PY", name: "Paraguay" },
    { code: "PE", name: "Peru" },
    { code: "PH", name: "Philippines" },
    { code: "PL", name: "Poland" },
    { code: "PT", name: "Portugal" },
    { code: "QA", name: "Qatar" },
    { code: "RO", name: "Romania" },
    { code: "RU", name: "Russia" },
    { code: "RW", name: "Rwanda" },
    { code: "KN", name: "Saint Kitts and Nevis" },
    { code: "LC", name: "Saint Lucia" },
    { code: "VC", name: "Saint Vincent and the Grenadines" },
    { code: "WS", name: "Samoa" },
    { code: "SM", name: "San Marino" },
    { code: "ST", name: "Sao Tome and Principe" },
    { code: "SA", name: "Saudi Arabia" },
    { code: "SN", name: "Senegal" },
    { code: "RS", name: "Serbia" },
    { code: "SC", name: "Seychelles" },
    { code: "SL", name: "Sierra Leone" },
    { code: "SG", name: "Singapore" },
    { code: "SK", name: "Slovakia" },
    { code: "SI", name: "Slovenia" },
    { code: "SB", name: "Solomon Islands" },
    { code: "SO", name: "Somalia" },
    { code: "ZA", name: "South Africa" },
    { code: "SS", name: "South Sudan" },
    { code: "ES", name: "Spain" },
    { code: "LK", name: "Sri Lanka" },
    { code: "SD", name: "Sudan" },
    { code: "SR", name: "Suriname" },
    { code: "SZ", name: "Eswatini" },
    { code: "SE", name: "Sweden" },
    { code: "CH", name: "Switzerland" },
    { code: "SY", name: "Syria" },
    { code: "TW", name: "Taiwan" },
    { code: "TJ", name: "Tajikistan" },
    { code: "TZ", name: "Tanzania" },
    { code: "TH", name: "Thailand" },
    { code: "TL", name: "Timor-Leste" },
    { code: "TG", name: "Togo" },
    { code: "TO", name: "Tonga" },
    { code: "TT", name: "Trinidad and Tobago" },
    { code: "TN", name: "Tunisia" },
    { code: "TR", name: "Turkey" },
    { code: "TM", name: "Turkmenistan" },
    { code: "TV", name: "Tuvalu" },
    { code: "UG", name: "Uganda" },
    { code: "UA", name: "Ukraine" },
    { code: "AE", name: "United Arab Emirates" },
    { code: "GB", name: "United Kingdom" },
    { code: "US", name: "United States" },
    { code: "UY", name: "Uruguay" },
    { code: "UZ", name: "Uzbekistan" },
    { code: "VU", name: "Vanuatu" },
    { code: "VA", name: "Vatican City" },
    { code: "VE", name: "Venezuela" },
    { code: "VN", name: "Vietnam" },
    { code: "YE", name: "Yemen" },
    { code: "ZM", name: "Zambia" },
    { code: "ZW", name: "Zimbabwe" },
  ];

  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        type: clientToEdit.type || "business",
        name: clientToEdit.name || "",
        email: clientToEdit.email || "",
        phone: clientToEdit.phone || "",
        street: clientToEdit.street || "",
        number: clientToEdit.number || "",
        bus: clientToEdit.bus || "",
        postcode: clientToEdit.postcode || "",
        city: clientToEdit.city || "",
        country: clientToEdit.country || "BE",
        vatNumber: clientToEdit.vatNumber || clientToEdit.vat_number || "",
      });
    }
  }, [clientToEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (type: string) => {
    setFormData((prev) => ({ ...prev, type }));
  };

  const handleCountryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      country: value,
    }));
  };

  const createLegalEntity = async (clientData: any) => {
    try {
      setIsCreatingLegalEntity(true);
      
      const { data, error } = await supabase.functions.invoke('create-client-legal-entity', {
        body: { client: clientData }
      });
      
      if (error) {
        console.error("Error creating legal entity:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create legal entity. Please try again.",
        });
        return { legalEntityId: null, peppolIdentifier: null };
      }
      
      console.log("Legal entity created:", data);
      
      const peppolData = (data?.peppol?.success && data?.peppol?.data) ? data.peppol.data : null;
      
      return { 
        legalEntityId: data?.data?.id || null,
        peppolIdentifier: peppolData 
      };
    } catch (error) {
      console.error("Exception creating legal entity:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
      return { legalEntityId: null, peppolIdentifier: null };
    } finally {
      setIsCreatingLegalEntity(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Name and email are required fields.",
      });
      return;
    }
    
    if (!formData.street || !formData.city || !formData.postcode || !formData.country) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Street, city, postal code, and country are required for electronic invoicing capabilities.",
      });
      return;
    }

    try {
      let legalEntityId = null;
      let peppolIdentifier = null;
      
      if (!isEditMode || !clientToEdit?.legal_entity_id) {
        const result = await createLegalEntity(formData);
        legalEntityId = result.legalEntityId;
        peppolIdentifier = result.peppolIdentifier;
        
        console.log("Received from legal entity creation:", { legalEntityId, peppolIdentifier });
      }

      if (isEditMode && onUpdateClient && clientToEdit) {
        onUpdateClient({
          id: clientToEdit.id,
          ...formData,
          vat_number: formData.vatNumber,
          legal_entity_id: legalEntityId || clientToEdit.legal_entity_id,
          peppol_identifier: peppolIdentifier || clientToEdit.peppol_identifier,
        });
      } else {
        onAddClient({
          ...formData,
          vat_number: formData.vatNumber,
          legal_entity_id: legalEntityId,
          peppol_identifier: peppolIdentifier,
        });
      }

      setFormData({
        type: "business",
        name: "",
        email: "",
        phone: "",
        street: "",
        number: "",
        bus: "",
        postcode: "",
        city: "",
        country: "BE",
        vatNumber: "",
      });

      toast({
        title: "Success",
        description: isEditMode
          ? "Client updated successfully."
          : "Client added successfully.",
      });

      onClose();
    } catch (error) {
      console.error("Error in client submission:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save client. Please try again.",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border/40 rounded-xl shadow-lg w-full max-w-md max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-10">
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <h2 className="text-lg font-semibold">
            {isEditMode ? "Edit Client" : "Add New Client"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors rounded-full p-1"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Type:
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    className="w-4 h-4 accent-primary"
                    checked={formData.type === "business"}
                    onChange={() => handleTypeChange("business")}
                  />
                  <span>Business</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    className="w-4 h-4 accent-primary"
                    checked={formData.type === "individual"}
                    onChange={() => handleTypeChange("individual")}
                  />
                  <span>Individual</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="Client name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="client@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="+32 123 456 789"
              />
            </div>

            <div className="border-t border-border/40 pt-4">
              <h3 className="font-medium mb-3">Address Details (Required for Electronic Invoicing)</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Street *
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="input-field w-full"
                    placeholder="Street name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Number
                    </label>
                    <input
                      type="text"
                      name="number"
                      value={formData.number}
                      onChange={handleChange}
                      className="input-field w-full"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Bus
                    </label>
                    <input
                      type="text"
                      name="bus"
                      value={formData.bus}
                      onChange={handleChange}
                      className="input-field w-full"
                      placeholder="A"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Postcode *
                    </label>
                    <input
                      type="text"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleChange}
                      className="input-field w-full"
                      placeholder="1000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="input-field w-full"
                      placeholder="Brussels"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Country *
                  </label>
                  <Select 
                    value={formData.country} 
                    onValueChange={handleCountryChange}
                    required
                  >
                    <SelectTrigger className="w-full border-apple-blue dark:border-apple-purple">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.code} - {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {formData.type === "business" && (
              <div className="border-t border-border/40 pt-4">
                <h3 className="font-medium mb-3">Business Details</h3>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    VAT Number{formData.country && " (Required for PEPPOL)"}
                  </label>
                  <input
                    type="text"
                    name="vatNumber"
                    value={formData.vatNumber}
                    onChange={handleChange}
                    className="input-field w-full"
                    placeholder="BE0123456789"
                    required={formData.type === "business"}
                  />
                  {formData.type === "business" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      VAT number is required for electronic invoicing via PEPPOL network.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="border-t border-border/40 p-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="apple-button "
              disabled={isCreatingLegalEntity}
            >
              {isCreatingLegalEntity 
                ? "Processing..." 
                : isEditMode 
                  ? "Update Client" 
                  : "Add Client"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddClientModal;
