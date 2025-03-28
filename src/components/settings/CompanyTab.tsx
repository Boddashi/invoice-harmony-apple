import React, { useState, useRef } from "react";
import CustomCard from "../ui/CustomCard";
import { CompanySettings } from "@/models/CompanySettings";
import { Check, Loader2, Upload, X, Building, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CompanyTabProps {
  companySettings: CompanySettings;
  setCompanySettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
  loading: boolean;
  saving: boolean;
  handleSaveCompany: (e: React.FormEvent) => Promise<void>;
}

const CompanyTab = ({
  companySettings,
  setCompanySettings,
  loading,
  saving,
  handleSaveCompany,
}: CompanyTabProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const europeanCountries = [
    { code: "AL", name: "Albania" },
    { code: "AD", name: "Andorra" },
    { code: "AT", name: "Austria" },
    { code: "BY", name: "Belarus" },
    { code: "BE", name: "Belgium" },
    { code: "BA", name: "Bosnia and Herzegovina" },
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
    { code: "IS", name: "Iceland" },
    { code: "IE", name: "Ireland" },
    { code: "IT", name: "Italy" },
    { code: "LV", name: "Latvia" },
    { code: "LI", name: "Liechtenstein" },
    { code: "LT", name: "Lithuania" },
    { code: "LU", name: "Luxembourg" },
    { code: "MT", name: "Malta" },
    { code: "MD", name: "Moldova" },
    { code: "MC", name: "Monaco" },
    { code: "ME", name: "Montenegro" },
    { code: "NL", name: "Netherlands" },
    { code: "MK", name: "North Macedonia" },
    { code: "NO", name: "Norway" },
    { code: "PL", name: "Poland" },
    { code: "PT", name: "Portugal" },
    { code: "RO", name: "Romania" },
    { code: "RU", name: "Russia" },
    { code: "SM", name: "San Marino" },
    { code: "RS", name: "Serbia" },
    { code: "SK", name: "Slovakia" },
    { code: "SI", name: "Slovenia" },
    { code: "ES", name: "Spain" },
    { code: "SE", name: "Sweden" },
    { code: "CH", name: "Switzerland" },
    { code: "UA", name: "Ukraine" },
    { code: "GB", name: "United Kingdom" },
    { code: "VA", name: "Vatican City" },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanySettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCountryChange = (value: string) => {
    setCompanySettings((prev) => ({
      ...prev,
      country: value,
    }));
  };

  const handleUploadLogoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()
      .toString(36)
      .substring(2, 15)}.${fileExt}`;

    try {
      setUploadingLogo(true);

      const { error: uploadError, data } = await supabase.storage
        .from("company-logos")
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      if (!data) {
        throw new Error("Failed to upload logo");
      }

      const { data: publicURL } = supabase.storage
        .from("company-logos")
        .getPublicUrl(fileName);

      if (!publicURL) {
        throw new Error("Failed to get public URL for uploaded logo");
      }

      setCompanySettings((prev) => ({
        ...prev,
        logo_url: publicURL.publicUrl,
      }));

      toast({
        title: "Logo uploaded",
        description: "Your company logo has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload company logo. Please try again.",
      });
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!companySettings.logo_url) return;

    try {
      setUploadingLogo(true);

      const fileName = companySettings.logo_url.split("/").pop();

      if (fileName) {
        const { error: deleteError } = await supabase.storage
          .from("company-logos")
          .remove([fileName]);

        if (deleteError) {
          throw deleteError;
        }
      }

      setCompanySettings((prev) => ({
        ...prev,
        logo_url: "",
      }));

      toast({
        title: "Logo removed",
        description: "Your company logo has been removed successfully.",
      });
    } catch (error) {
      console.error("Error removing logo:", error);
      toast({
        variant: "destructive",
        title: "Removal failed",
        description: "Failed to remove company logo. Please try again.",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <CustomCard>
      <h2 className="text-xl font-semibold mb-6">Company Details</h2>
      <p className="text-muted-foreground mb-6">
        Configure your company information for invoices and legal entity registration.
      </p>

      <form onSubmit={handleSaveCompany}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="company_name"
                className="input-field w-full"
                value={companySettings.company_name}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Company Email
              </label>
              <input
                type="email"
                name="company_email"
                className="input-field w-full"
                value={companySettings.company_email}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Company Phone
              </label>
              <input
                type="tel"
                name="company_phone"
                className="input-field w-full"
                value={companySettings.company_phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                Company Website
              </label>
              <input
                type="url"
                name="company_website"
                className="input-field w-full"
                value={companySettings.company_website}
                onChange={handleInputChange}
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-1">
                <label className="block text-sm font-medium text-foreground mb-1">
                  VAT Number
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[200px] text-xs">Your VAT number is required for PEPPOL e-invoicing network integration.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <input
                type="text"
                name="vat_number"
                className="input-field w-full border-apple-blue dark:border-apple-purple"
                value={companySettings.vat_number}
                onChange={handleInputChange}
                placeholder="e.g. BE0628719851"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Required for e-invoicing. Format as country code + VAT number without spaces (e.g. BE0628719851).
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium mb-4">Company Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Street
                </label>
                <input
                  type="text"
                  name="street"
                  className="input-field w-full"
                  value={companySettings.street}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Number
                </label>
                <input
                  type="text"
                  name="number"
                  className="input-field w-full"
                  value={companySettings.number}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Bus/Suite
                </label>
                <input
                  type="text"
                  name="bus"
                  className="input-field w-full"
                  value={companySettings.bus}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postal_code"
                  className="input-field w-full"
                  value={companySettings.postal_code}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  className="input-field w-full"
                  value={companySettings.city}
                  onChange={handleInputChange}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Country
                </label>
                <div className="flex items-center gap-1">
                  <Select 
                    value={companySettings.country} 
                    onValueChange={handleCountryChange}
                  >
                    <SelectTrigger className="w-full border-apple-blue dark:border-apple-purple">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {europeanCountries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.code} - {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">Your country code is required for PEPPOL e-invoicing network integration.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Required for e-invoicing registration.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium mb-4">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bank_name"
                  className="input-field w-full"
                  value={companySettings.bank_name}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  name="account_number"
                  className="input-field w-full"
                  value={companySettings.account_number}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  SWIFT / BIC
                </label>
                <input
                  type="text"
                  name="swift"
                  className="input-field w-full"
                  value={companySettings.swift}
                  onChange={handleInputChange}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  IBAN
                </label>
                <input
                  type="text"
                  name="iban"
                  className="input-field w-full"
                  value={companySettings.iban}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium mb-4">Company Logo</h3>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded bg-secondary flex items-center justify-center text-muted-foreground overflow-hidden border border-border">
                {companySettings.logo_url ? (
                  <img
                    src={companySettings.logo_url}
                    alt="Company logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building size={32} />
                )}
              </div>

              <div className="flex gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  className="secondary-button flex items-center gap-2"
                  onClick={handleUploadLogoClick}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload Logo
                    </>
                  )}
                </button>
                {companySettings.logo_url && (
                  <button
                    type="button"
                    className="ghost-button text-apple-red flex items-center gap-2"
                    onClick={handleRemoveLogo}
                    disabled={uploadingLogo}
                  >
                    <X size={16} />
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Recommended: Square image of at least 200x200 pixels
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex justify-end">
          <button type="submit" className="apple-button" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save & Register Legal Entity"
            )}
          </button>
        </div>
      </form>
    </CustomCard>
  );
};

export default CompanyTab;
