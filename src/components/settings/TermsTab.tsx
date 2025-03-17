
import React, { useRef, useState } from "react";
import CustomCard from "../ui/CustomCard";
import { CompanySettings } from "@/models/CompanySettings";
import { FileText, Loader2, Upload, Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TermsTabProps {
  companySettings: CompanySettings;
  setCompanySettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
  loading: boolean;
  saving: boolean;
  handleSaveCompany: (e: React.FormEvent) => Promise<void>;
}

const TermsTab = ({
  companySettings,
  setCompanySettings,
  loading,
  saving,
  handleSaveCompany,
}: TermsTabProps) => {
  const { toast } = useToast();
  const termsFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingTerms, setUploadingTerms] = useState(false);

  const handleUploadTermsClick = () => {
    if (termsFileInputRef.current) {
      termsFileInputRef.current.click();
    }
  };

  const handleTermsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];

    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF document for Terms & Conditions",
      });
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `terms_${Math.random()
      .toString(36)
      .substring(2, 15)}.${fileExt}`;

    try {
      setUploadingTerms(true);

      const { error: uploadError, data } = await supabase.storage
        .from("company-documents")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      if (!data) {
        throw new Error("Failed to upload terms & conditions");
      }

      const { data: publicURL } = supabase.storage
        .from("company-documents")
        .getPublicUrl(fileName);

      if (!publicURL) {
        throw new Error("Failed to get public URL for uploaded terms & conditions");
      }

      setCompanySettings((prev) => ({
        ...prev,
        terms_and_conditions_url: publicURL.publicUrl,
      }));

      toast({
        title: "Terms & Conditions uploaded",
        description: "Your terms & conditions document has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading terms & conditions:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload terms & conditions document. Please try again.",
      });
    } finally {
      setUploadingTerms(false);
      if (termsFileInputRef.current) {
        termsFileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveTerms = async () => {
    if (!companySettings.terms_and_conditions_url) return;

    try {
      setUploadingTerms(true);

      const fileName = companySettings.terms_and_conditions_url
        .split("/")
        .pop();

      if (fileName) {
        const { error: deleteError } = await supabase.storage
          .from("company-documents")
          .remove([fileName]);

        if (deleteError) {
          throw deleteError;
        }
      }

      setCompanySettings((prev) => ({
        ...prev,
        terms_and_conditions_url: "",
      }));

      toast({
        title: "Terms & Conditions removed",
        description: "Your terms & conditions document has been removed successfully.",
      });
    } catch (error) {
      console.error("Error removing terms & conditions:", error);
      toast({
        variant: "destructive",
        title: "Removal failed",
        description: "Failed to remove terms & conditions document. Please try again.",
      });
    } finally {
      setUploadingTerms(false);
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
      <h2 className="text-xl font-semibold mb-6">
        Terms & Conditions
      </h2>
      <p className="text-muted-foreground mb-6">
        Upload a PDF document with your company's terms and
        conditions.
      </p>

      <form onSubmit={handleSaveCompany}>
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-medium mb-4">
              Terms & Conditions Document
            </h3>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center text-muted-foreground overflow-hidden border border-border shrink-0">
                  <FileText size={24} />
                </div>

                <div className="flex-1">
                  {companySettings.terms_and_conditions_url ? (
                    <div>
                      <div className="text-sm font-medium">
                        Terms & Conditions document uploaded
                      </div>
                      <div className="text-xs text-muted-foreground">
                        PDF document
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm text-muted-foreground">
                        No document uploaded
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Upload a PDF document with your terms and
                        conditions
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 mt-2 sm:mt-0">
                  <input
                    type="file"
                    ref={termsFileInputRef}
                    accept="application/pdf"
                    onChange={handleTermsUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    className="secondary-button flex items-center gap-2"
                    onClick={handleUploadTermsClick}
                    disabled={uploadingTerms}
                  >
                    {uploadingTerms ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-left">
                          Uploading...
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload PDF
                      </>
                    )}
                  </button>

                  {companySettings.terms_and_conditions_url && (
                    <>
                      <a
                        href={
                          companySettings.terms_and_conditions_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="secondary-button flex items-center gap-2"
                      >
                        <Download size={16} />
                        View
                      </a>
                      <button
                        type="button"
                        className="ghost-button text-apple-red flex items-center gap-2"
                        onClick={handleRemoveTerms}
                        disabled={uploadingTerms}
                      >
                        <X size={16} />
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Please upload a PDF document with your company's
                terms and conditions. This document will be used in
                your invoices and other legal documents.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex justify-end">
          <button
            type="submit"
            className="apple-button w-full sm:w-auto"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Terms & Conditions"
            )}
          </button>
        </div>
      </form>
    </CustomCard>
  );
};

export default TermsTab;
