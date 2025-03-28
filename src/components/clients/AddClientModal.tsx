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
    { code: "AT", name: "Austria" },
    { code: "BE", name: "Belgium" },
    { code: "BG", name: "Bulgaria" },
    { code: "HR", name: "Croatia" },
    { code: "CY", name: "Cyprus" },
    { code: "CZ", name: "Czech Republic" },
    { code: "DK", name: "Denmark" },
    { code: "EE", name: "Estonia" },
    { code: "FI", name: "Finland" },
    { code: "FR", name: "France" },
    { code: "DE", name: "Germany" },
    { code: "GR", name: "Greece" },
    { code: "HU", name: "Hungary" },
    { code: "IE", name: "Ireland" },
    { code: "IT", name: "Italy" },
    { code: "LV", name: "Latvia" },
    { code: "LT", name: "Lithuania" },
    { code: "LU", name: "Luxembourg" },
    { code: "MT", name: "Malta" },
    { code: "NL", name: "Netherlands" },
    { code: "PL", name: "Poland" },
    { code: "PT", name: "Portugal" },
    { code: "RO", name: "Romania" },
    { code: "SK", name: "Slovakia" },
    { code: "SI", name: "Slovenia" },
    { code: "ES", name: "Spain" },
    { code: "SE", name: "Sweden" },
    { code: "GB", name: "United Kingdom" },
    { code: "AL", name: "Albania" },
    { code: "AD", name: "Andorra" },
    { code: "AM", name: "Armenia" },
    { code: "BY", name: "Belarus" },
    { code: "BA", name: "Bosnia and Herzegovina" },
    { code: "CH", name: "Switzerland" },
    { code: "GE", name: "Georgia" },
    { code: "IS", name: "Iceland" },
    { code: "LI", name: "Liechtenstein" },
    { code: "MD", name: "Moldova" },
    { code: "MC", name: "Monaco" },
    { code: "ME", name: "Montenegro" },
    { code: "MK", name: "North Macedonia" },
    { code: "NO", name: "Norway" },
    { code: "RU", name: "Russia" },
    { code: "SM", name: "San Marino" },
    { code: "RS", name: "Serbia" },
    { code: "TR", name: "Turkey" },
    { code: "UA", name: "Ukraine" },
    { code: "VA", name: "Vatican City" },
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

      const { data, error } = await supabase.functions.invoke(
        "create-client-legal-entity",
        {
          body: { client: clientData },
        }
      );

      if (error) {
        console.error("Error creating legal entity:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create legal entity. Please try again.",
        });
        return { legalEntityId: null };
      }

      console.log("Legal entity created:", data);

      return {
        legalEntityId: data?.data?.id || null,
      };
    } catch (error) {
      console.error("Exception creating legal entity:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
      return { legalEntityId: null };
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

    if (
      !formData.street ||
      !formData.city ||
      !formData.postcode ||
      !formData.country
    ) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Street, city, postal code, and country are required for electronic invoicing capabilities.",
      });
      return;
    }

    try {
      let legalEntityId = null;

      const clientDataForRequest = {
        ...formData,
        legal_entity_id: clientToEdit?.legal_entity_id || null,
      };

      const result = await createLegalEntity(clientDataForRequest);
      legalEntityId = result.legalEntityId || clientToEdit?.legal_entity_id;

      console.log("Received from legal entity creation:", { legalEntityId });

      const clientData = {
        ...formData,
        vat_number: formData.vatNumber,
        legal_entity_id: legalEntityId,
      };

      console.log("Storing client data:", clientData);

      if (isEditMode && onUpdateClient && clientToEdit) {
        onUpdateClient({
          id: clientToEdit.id,
          ...clientData,
        });
      } else {
        onAddClient(clientData);
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
              <h3 className="font-medium mb-3">
                Address Details (Required for Electronic Invoicing)
              </h3>

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
                    <SelectContent className="bg-popover">
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
                      VAT number is required for electronic invoicing via PEPPOL
                      network.
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
              className="px-4 py-2 rounded-full text-muted-foreground hover:bg-secondary transition-colors"
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
