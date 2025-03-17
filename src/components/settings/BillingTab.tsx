
import React from "react";
import CustomCard from "../ui/CustomCard";
import { CompanySettings } from "@/models/CompanySettings";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BillingTabProps {
  companySettings: CompanySettings;
  setCompanySettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
  loading: boolean;
  saving: boolean;
  handleSaveCompany: (e: React.FormEvent) => Promise<void>;
}

const BillingTab = ({
  companySettings,
  setCompanySettings,
  loading,
  saving,
  handleSaveCompany,
}: BillingTabProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanySettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string, name: string) => {
    if (name === "invoice_number_type") {
      const validValue =
        value === "date" || value === "incremental" ? value : "date";
      setCompanySettings((prev) => ({
        ...prev,
        [name]: validValue,
      }));
    } else {
      setCompanySettings((prev) => ({
        ...prev,
        [name]: value,
      }));
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
      <h2 className="text-xl font-semibold mb-6">Billing Settings</h2>
      <p className="text-muted-foreground mb-6">
        Configure your invoice settings and payment methods.
      </p>

      <form onSubmit={handleSaveCompany}>
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-medium mb-4">
              Invoice Numbering
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="invoice_prefix">
                  Invoice Prefix
                </Label>
                <div className="flex items-center mt-1">
                  <Input
                    id="invoice_prefix"
                    name="invoice_prefix"
                    placeholder="e.g. INV"
                    value={companySettings.invoice_prefix}
                    onChange={handleInputChange}
                    className="input-field w-full"
                  />
                  <span className="mx-2 text-muted-foreground">
                    -
                  </span>
                  <div className="bg-secondary text-muted-foreground px-3 py-2 rounded border border-input">
                    {companySettings.invoice_number_type === "date"
                      ? "YYYYMMDD"
                      : "00001"}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Example: {companySettings.invoice_prefix || "INV"}
                  -
                  {companySettings.invoice_number_type === "date"
                    ? "20240701"
                    : "00001"}
                </p>
              </div>

              <div>
                <Label htmlFor="invoice_number_type">
                  Numbering Type
                </Label>
                <Select
                  value={companySettings.invoice_number_type}
                  onValueChange={(value) =>
                    handleSelectChange(value, "invoice_number_type")
                  }
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select numbering type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">
                      Date-based (YYYYMMDD)
                    </SelectItem>
                    <SelectItem value="incremental">
                      Incremental (00001, 00002...)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose how invoice numbers will be generated
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium mb-4">
              Payment Information
            </h3>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Label htmlFor="yuki_email">
                Yuki Email Address
              </Label>
              <Input
                id="yuki_email"
                name="yuki_email"
                type="email"
                placeholder="Enter Yuki email address"
                value={companySettings.yuki_email || ""}
                onChange={handleInputChange}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email address used for Yuki integration
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex justify-end">
          <button
            type="submit"
            className="apple-button"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Billing Settings"
            )}
          </button>
        </div>
      </form>
    </CustomCard>
  );
};

export default BillingTab;
