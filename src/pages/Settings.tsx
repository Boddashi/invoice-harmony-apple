
import React, { useState, useEffect } from "react";
import MainLayout from "../components/layout/MainLayout";
import { User, Building, CreditCard, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "../contexts/CurrencyContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  CompanySettings,
  defaultCompanySettings,
} from "@/models/CompanySettings";
import { TabItem } from "@/models/SettingsModels";
import SettingsTabs from "@/components/settings/SettingsTabs";
import ProfileTab from "@/components/settings/ProfileTab";
import CompanyTab from "@/components/settings/CompanyTab";
import BillingTab from "@/components/settings/BillingTab";
import TermsTab from "@/components/settings/TermsTab";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();
  const { currency, setCurrency } = useCurrency();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(
    defaultCompanySettings
  );

  const tabs: TabItem[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "company", label: "Company", icon: Building },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "terms", label: "Terms & Conditions", icon: FileText },
  ];

  useEffect(() => {
    if (!user) return;

    const fetchCompanySettings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("company_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching company settings:", error);
          throw error;
        }

        if (data) {
          setCompanySettings({
            ...defaultCompanySettings,
            ...data,
            postal_code: data.postal_code || "",
            invoice_prefix: data.invoice_prefix || "",
            invoice_number_type:
              (data.invoice_number_type as "date" | "incremental") || "date",
            logo_url: data.logo_url || "",
            yuki_email: data.yuki_email || "",
            terms_and_conditions_url: data.terms_and_conditions_url || "",
          });

          if (data.default_currency) {
            setCurrency(data.default_currency);
          }
        }
      } catch (error) {
        console.error("Failed to fetch company settings:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load company information",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompanySettings();
  }, [user, setCurrency, toast]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to save company information.",
      });
      return;
    }

    try {
      setSaving(true);

      const settingsData = {
        ...companySettings,
        user_id: user.id,
        default_currency: currency,
      };

      const { data: existingSettings, error: checkError } = await supabase
        .from("company_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing settings:", checkError);
        throw checkError;
      }

      let saveError;

      if (existingSettings) {
        const { error } = await supabase
          .from("company_settings")
          .update(settingsData)
          .eq("id", existingSettings.id);

        saveError = error;
      } else {
        const { error } = await supabase
          .from("company_settings")
          .insert(settingsData);

        saveError = error;
      }

      if (saveError) {
        console.error("Error saving company settings:", saveError);
        throw saveError;
      }

      // After saving to Supabase, create legal entity via API
      try {
        const { data, error } = await supabase.functions.invoke("create-legal-entity", {
          body: { companySettings: settingsData },
        });

        if (error) {
          console.error("Error creating legal entity:", error);
          toast({
            variant: "destructive",
            title: "Warning",
            description: "Company information saved, but failed to create legal entity.",
          });
        } else {
          console.log("Legal entity created:", data);
          toast({
            title: "Success",
            description: "Company information saved and legal entity created.",
          });
        }
      } catch (apiError) {
        console.error("Exception creating legal entity:", apiError);
        toast({
          variant: "destructive",
          title: "Warning",
          description: "Company information saved, but failed to create legal entity.",
        });
      }
    } catch (error) {
      console.error("Failed to save company settings:", error);
      toast({
        variant: "destructive",
        title: "Error saving",
        description: "Failed to save company information.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="col-span-1">
            {/* Mobile tabs */}
            <div className="block lg:hidden mb-6">
              <SettingsTabs
                tabs={tabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                orientation="horizontal"
              />
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:block">
              <SettingsTabs
                tabs={tabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                orientation="vertical"
              />
            </div>
          </div>

          <div className="col-span-1 lg:col-span-3 animate-fade-in">
            {activeTab === "profile" && <ProfileTab />}

            {activeTab === "company" && (
              <CompanyTab
                companySettings={companySettings}
                setCompanySettings={setCompanySettings}
                currency={currency}
                setCurrency={setCurrency}
                loading={loading}
                saving={saving}
                handleSaveCompany={handleSaveCompany}
              />
            )}

            {activeTab === "billing" && (
              <BillingTab
                companySettings={companySettings}
                setCompanySettings={setCompanySettings}
                loading={loading}
                saving={saving}
                handleSaveCompany={handleSaveCompany}
              />
            )}

            {activeTab === "terms" && (
              <TermsTab
                companySettings={companySettings}
                setCompanySettings={setCompanySettings}
                loading={loading}
                saving={saving}
                handleSaveCompany={handleSaveCompany}
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
