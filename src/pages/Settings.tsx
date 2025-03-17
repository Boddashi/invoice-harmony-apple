import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../components/layout/MainLayout';
import CustomCard from '../components/ui/CustomCard';
import { User, Building, CreditCard, Shield, Bell, Check, Loader2, Upload, X, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CompanySettings, defaultCompanySettings } from '@/models/CompanySettings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const Settings = () => {
  const [activeTab, setActiveTab] = React.useState('profile');
  const { toast } = useToast();
  const { currency, setCurrency, currencySymbol } = useCurrency();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingTerms, setUploadingTerms] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompanySettings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const termsFileInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
  ];

  const currencies = [
    { code: 'EUR', label: 'Euro (€)', symbol: '€' },
    { code: 'USD', label: 'US Dollar ($)', symbol: '$' },
    { code: 'GBP', label: 'British Pound (£)', symbol: '£' },
    { code: 'JPY', label: 'Japanese Yen (¥)', symbol: '¥' },
    { code: 'CNY', label: 'Chinese Yuan (¥)', symbol: '¥' },
    { code: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
  ];

  useEffect(() => {
    if (!user) return;
    
    const fetchCompanySettings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('company_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching company settings:', error);
          throw error;
        }
        
        if (data) {
          setCompanySettings({
            ...defaultCompanySettings,
            ...data,
            postal_code: data.postal_code || '',
            invoice_prefix: data.invoice_prefix || '',
            invoice_number_type: (data.invoice_number_type as 'date' | 'incremental') || 'date',
            logo_url: data.logo_url || '',
            yuki_email: data.yuki_email || '',
            terms_and_conditions_url: data.terms_and_conditions_url || ''
          });
          
          if (data.default_currency) {
            setCurrency(data.default_currency);
          }
        }
      } catch (error) {
        console.error('Failed to fetch company settings:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load company information"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompanySettings();
  }, [user, setCurrency, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanySettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCurrencyChange = (currencyCode: string) => {
    setCurrency(currencyCode);
    setCompanySettings(prev => ({
      ...prev,
      default_currency: currencyCode
    }));
  };

  const handleSelectChange = (value: string, name: string) => {
    if (name === 'invoice_number_type') {
      const validValue = value === 'date' || value === 'incremental' ? value : 'date';
      setCompanySettings(prev => ({
        ...prev,
        [name]: validValue
      }));
    } else {
      setCompanySettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleUploadLogoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) {
      return;
    }
    
    const file = files[0];
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    try {
      setUploadingLogo(true);
      
      const { error: uploadError, data } = await supabase
        .storage
        .from('company-logos')
        .upload(fileName, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      if (!data) {
        throw new Error('Failed to upload logo');
      }
      
      const { data: publicURL } = supabase
        .storage
        .from('company-logos')
        .getPublicUrl(fileName);
      
      if (!publicURL) {
        throw new Error('Failed to get public URL for uploaded logo');
      }
      
      setCompanySettings(prev => ({
        ...prev,
        logo_url: publicURL.publicUrl
      }));
      
      toast({
        title: "Logo uploaded",
        description: "Your company logo has been uploaded successfully."
      });
      
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload company logo. Please try again."
      });
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleRemoveLogo = async () => {
    if (!companySettings.logo_url) return;
    
    try {
      setUploadingLogo(true);
      
      const fileName = companySettings.logo_url.split('/').pop();
      
      if (fileName) {
        const { error: deleteError } = await supabase
          .storage
          .from('company-logos')
          .remove([fileName]);
        
        if (deleteError) {
          throw deleteError;
        }
      }
      
      setCompanySettings(prev => ({
        ...prev,
        logo_url: ''
      }));
      
      toast({
        title: "Logo removed",
        description: "Your company logo has been removed successfully."
      });
      
    } catch (error) {
      console.error('Error removing logo:', error);
      toast({
        variant: "destructive",
        title: "Removal failed",
        description: "Failed to remove company logo. Please try again."
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadTermsClick = () => {
    if (termsFileInputRef.current) {
      termsFileInputRef.current.click();
    }
  };
  
  const handleTermsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) {
      return;
    }
    
    const file = files[0];
    
    if (file.type !== 'application/pdf') {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF document for Terms & Conditions"
      });
      return;
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `terms_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    try {
      setUploadingTerms(true);
      
      const { data: buckets } = await supabase
        .storage
        .listBuckets();
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'company-documents');
      
      if (!bucketExists) {
        await supabase
          .storage
          .createBucket('company-documents', {
            public: false
          });
      }
      
      const { error: uploadError, data } = await supabase
        .storage
        .from('company-documents')
        .upload(fileName, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      if (!data) {
        throw new Error('Failed to upload terms & conditions');
      }
      
      const { data: publicURL } = supabase
        .storage
        .from('company-documents')
        .getPublicUrl(fileName);
      
      if (!publicURL) {
        throw new Error('Failed to get public URL for uploaded terms & conditions');
      }
      
      setCompanySettings(prev => ({
        ...prev,
        terms_and_conditions_url: publicURL.publicUrl
      }));
      
      toast({
        title: "Terms & Conditions uploaded",
        description: "Your terms & conditions document has been uploaded successfully."
      });
      
    } catch (error) {
      console.error('Error uploading terms & conditions:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload terms & conditions document. Please try again."
      });
    } finally {
      setUploadingTerms(false);
      if (termsFileInputRef.current) {
        termsFileInputRef.current.value = '';
      }
    }
  };
  
  const handleRemoveTerms = async () => {
    if (!companySettings.terms_and_conditions_url) return;
    
    try {
      setUploadingTerms(true);
      
      const fileName = companySettings.terms_and_conditions_url.split('/').pop();
      
      if (fileName) {
        const { error: deleteError } = await supabase
          .storage
          .from('company-documents')
          .remove([fileName]);
        
        if (deleteError) {
          throw deleteError;
        }
      }
      
      setCompanySettings(prev => ({
        ...prev,
        terms_and_conditions_url: ''
      }));
      
      toast({
        title: "Terms & Conditions removed",
        description: "Your terms & conditions document has been removed successfully."
      });
      
    } catch (error) {
      console.error('Error removing terms & conditions:', error);
      toast({
        variant: "destructive",
        title: "Removal failed",
        description: "Failed to remove terms & conditions document. Please try again."
      });
    } finally {
      setUploadingTerms(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to save company information."
      });
      return;
    }

    try {
      setSaving(true);
      
      const settingsData = {
        ...companySettings,
        user_id: user.id,
        default_currency: currency
      };
      
      const { data: existingSettings, error: checkError } = await supabase
        .from('company_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking existing settings:', checkError);
        throw checkError;
      }
      
      let saveError;
      
      if (existingSettings) {
        const { error } = await supabase
          .from('company_settings')
          .update(settingsData)
          .eq('id', existingSettings.id);
        
        saveError = error;
      } else {
        const { error } = await supabase
          .from('company_settings')
          .insert(settingsData);
        
        saveError = error;
      }
      
      if (saveError) {
        console.error('Error saving company settings:', saveError);
        throw saveError;
      }
      
      toast({
        title: "Company information saved",
        description: "Your company details have been updated successfully."
      });
    } catch (error) {
      console.error('Failed to save company settings:', error);
      toast({
        variant: "destructive",
        title: "Error saving",
        description: "Failed to save company information."
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <CustomCard className="overflow-hidden">
              <div className="divide-y divide-border">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "w-full p-4 flex items-center gap-3 transition-colors",
                        isActive ? "bg-apple-blue/10" : "hover:bg-secondary"
                      )}
                    >
                      <Icon size={20} className={isActive ? "text-apple-blue" : "text-muted-foreground"} />
                      <span className={isActive ? "font-medium text-apple-blue" : ""}>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </CustomCard>
          </div>
          
          <div className="md:col-span-3 animate-fade-in">
            {activeTab === 'profile' && (
              <CustomCard>
                <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                    <input type="text" className="input-field w-full" defaultValue="John" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                    <input type="text" className="input-field w-full" defaultValue="Appleseed" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                    <input type="email" className="input-field w-full" defaultValue="john@example.com" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
                    <input type="tel" className="input-field w-full" defaultValue="(123) 456-7890" />
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-border flex justify-end">
                  <button className="apple-button">Save Changes</button>
                </div>
              </CustomCard>
            )}
            
            {activeTab === 'company' && (
              <CustomCard>
                <h2 className="text-xl font-semibold mb-6">Company Details</h2>
                <p className="text-muted-foreground mb-6">Configure your company information for invoices.</p>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <form onSubmit={handleSaveCompany}>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-foreground mb-1">Company Name</label>
                          <input 
                            type="text" 
                            name="company_name"
                            className="input-field w-full" 
                            value={companySettings.company_name} 
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Company Email</label>
                          <input 
                            type="email" 
                            name="company_email"
                            className="input-field w-full" 
                            value={companySettings.company_email} 
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Company Phone</label>
                          <input 
                            type="tel" 
                            name="company_phone"
                            className="input-field w-full" 
                            value={companySettings.company_phone} 
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-foreground mb-1">Company Website</label>
                          <input 
                            type="url" 
                            name="company_website"
                            className="input-field w-full" 
                            value={companySettings.company_website} 
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">VAT Number</label>
                          <input 
                            type="text" 
                            name="vat_number"
                            className="input-field w-full" 
                            value={companySettings.vat_number} 
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Default Currency</label>
                          <div className="flex flex-wrap gap-2">
                            {currencies.map((curr) => (
                              <button
                                key={curr.code}
                                type="button"
                                onClick={() => handleCurrencyChange(curr.code)}
                                className={cn(
                                  "px-3 py-2 border rounded-md flex items-center gap-2 transition-colors",
                                  currency === curr.code 
                                    ? "bg-apple-blue text-white border-apple-blue" 
                                    : "bg-background border-border hover:bg-secondary"
                                )}
                              >
                                <span>{curr.symbol}</span>
                                <span>{curr.code}</span>
                                {currency === curr.code && <Check size={16} />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-base font-medium mb-4">Company Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">Street</label>
                            <input 
                              type="text" 
                              name="street"
                              className="input-field w-full" 
                              value={companySettings.street} 
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Number</label>
                            <input 
                              type="text" 
                              name="number"
                              className="input-field w-full" 
                              value={companySettings.number} 
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Bus/Suite</label>
                            <input 
                              type="text" 
                              name="bus"
                              className="input-field w-full" 
                              value={companySettings.bus} 
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Postal Code</label>
                            <input 
                              type="text" 
                              name="postal_code"
                              className="input-field w-full" 
                              value={companySettings.postal_code} 
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">City</label>
                            <input 
                              type="text" 
                              name="city"
                              className="input-field w-full" 
                              value={companySettings.city} 
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">Country</label>
                            <input 
                              type="text" 
                              name="country"
                              className="input-field w-full" 
                              value={companySettings.country} 
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-base font-medium mb-4">Payment Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">Bank Name</label>
                            <input 
                              type="text" 
                              name="bank_name"
                              className="input-field w-full" 
                              value={companySettings.bank_name} 
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Account Number</label>
                            <input 
                              type="text" 
                              name="account_number"
                              className="input-field w-full" 
                              value={companySettings.account_number} 
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">SWIFT / BIC</label>
                            <input 
                              type="text" 
                              name="swift"
                              className="input-field w-full" 
                              value={companySettings.swift} 
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">IBAN</label>
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
                        ) : 'Save Company Information'}
                      </button>
                    </div>
                  </form>
                )}
              </CustomCard>
            )}
            
            {activeTab === 'billing' && (
              <CustomCard>
                <h2 className="text-xl font-semibold mb-6">Billing Settings</h2>
                <p className="text-muted-foreground mb-6">Configure your invoice settings and payment methods.</p>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <form onSubmit={handleSaveCompany}>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-medium mb-4">Invoice Numbering</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
                            <div className="flex items-center mt-1">
                              <Input
                                id="invoice_prefix"
                                name="invoice_prefix"
                                placeholder="e.g. INV"
                                value={companySettings.invoice_prefix}
                                onChange={handleInputChange}
                                className="input-field w-full"
                              />
                              <span className="mx-2 text-muted-foreground">-</span>
                              <div className="bg-secondary text-muted-foreground px-3 py-2 rounded border border-input">
                                {companySettings.invoice_number_type === 'date' ? 'YYYYMMDD' : '00001'}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Example: {companySettings.invoice_prefix || 'INV'}-{companySettings.invoice_number_type === 'date' ? '20240701' : '00001'}
                            </p>
                          </div>
                          
                          <div>
                            <Label htmlFor="invoice_number_type">Numbering Type</Label>
                            <Select
                              value={companySettings.invoice_number_type}
                              onValueChange={(value) => handleSelectChange(value, 'invoice_number_type')}
                            >
                              <SelectTrigger className="w-full mt-1">
                                <SelectValue placeholder="Select numbering type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="date">Date-based (YYYYMMDD)</SelectItem>
                                <SelectItem value="incremental">Incremental (00001, 00002...)</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                              Choose how invoice numbers will be generated
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-base font-medium mb-4">Payment Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">Bank Name</label>
                            <input 
                              type="text" 
                              name="bank_name"
                              className="input-field w-full" 
                              value={companySettings.bank_name} 
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Account Number</label>
                            <input 
                              type="text" 
                              name="account_number"
                              className="input-field w-full" 
                              value={companySettings.account_number} 
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">SWIFT / BIC</label>
                            <input 
                              type="text" 
                              name="swift"
                              className="input-field w-full" 
                              value={companySettings.swift} 
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">IBAN</label>
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
                        <h3 className="text-base font-medium mb-4">Yuki</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="md:col-span-2">
                            <Label htmlFor="yuki_email">Yuki Email Address</Label>
                            <Input
                              id="yuki_email"
                              name="yuki_email"
                              type="email"
                              placeholder="Enter Yuki email address"
                              value={companySettings.yuki_email || ''}
                              onChange={handleInputChange}
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Email address used for Yuki integration
                            </p>
                          </div>
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
                        ) : 'Save Billing Settings'}
                      </button>
                    </div>
                  </form>
                )}
              </CustomCard>
            )}
            
            {activeTab === 'terms' && (
              <CustomCard>
                <h2 className="text-xl font-semibold mb-6">Terms & Conditions</h2>
                <p className="text-muted-foreground mb-6">Upload a PDF document with your company's terms and conditions.</p>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <form onSubmit={handleSaveCompany}>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-medium mb-4">Terms & Conditions Document</h3>
                        <div className="flex flex-col space-y-4">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center text-muted-foreground overflow-hidden border border-border">
                              <FileText size={24} />
                            </div>
                            
                            <div className="flex-1">
                              {companySettings.terms_and_conditions_url ? (
                                <div>
                                  <div className="text-sm font-medium">Terms & Conditions document uploaded</div>
                                  <div className="text-xs text-muted-foreground">PDF document</div>
                                </div>
                              ) : (
                                <div>
                                  <div className="text-sm text-muted-foreground">No document uploaded</div>
                                  <div className="text-xs text-muted-foreground">Upload a PDF document with your terms and conditions</div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-3">
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
                                    <span className="text-left">Uploading...</span>
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
                                    href={companySettings.terms_and_conditions_url}
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
                            Please upload a PDF document with your company's terms and conditions.
                            This document will be used in your invoices and other legal documents.
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
                        ) : 'Save Terms & Conditions'}
                      </button>
                    </div>
                  </form>
                )}
              </CustomCard>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
