import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import CustomCard from '../components/ui/CustomCard';
import { User, Building, CreditCard, Shield, Bell, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CompanySettings, defaultCompanySettings } from '@/models/CompanySettings';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Settings = () => {
  const [activeTab, setActiveTab] = React.useState('profile');
  const { toast } = useToast();
  const { currency, setCurrency, currencySymbol } = useCurrency();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompanySettings);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
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
            ...data,
            postal_code: data.postal_code || ''
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

  const handleInvoiceNumberTypeChange = (value: 'date' | 'incremental') => {
    setCompanySettings(prev => ({
      ...prev,
      invoice_number_type: value
    }));
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
                
                <div className="mt-8">
                  <h3 className="font-medium mb-3">Profile Picture</h3>
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                      <User size={32} />
                    </div>
                    
                    <div className="flex gap-3">
                      <button className="secondary-button">Upload New</button>
                      <button className="ghost-button text-apple-red">Remove</button>
                    </div>
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
                          <div className="w-20 h-20 rounded bg-secondary flex items-center justify-center text-muted-foreground">
                            <Building size={32} />
                          </div>
                          
                          <div className="flex gap-3">
                            <button type="button" className="secondary-button">Upload Logo</button>
                            <button type="button" className="ghost-button text-apple-red">Remove</button>
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
                        ) : 'Save Company Information'}
                      </button>
                    </div>
                  </form>
                )}
              </CustomCard>
            )}
            
            {activeTab === 'billing' && (
              <CustomCard>
                <h2 className="text-xl font-semibold mb-6">Billing & Subscription</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium mb-4">Invoice Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <Label htmlFor="invoice_prefix" className="block text-sm font-medium text-foreground mb-1">
                          Invoice Number Prefix
                        </Label>
                        <Input
                          id="invoice_prefix"
                          name="invoice_prefix"
                          type="text"
                          value={companySettings.invoice_prefix}
                          onChange={handleInputChange}
                          placeholder="INV"
                          className="input-field w-full"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          This prefix will appear before your invoice numbers (e.g. INV-0001)
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="invoice_number_type" className="block text-sm font-medium text-foreground mb-1">
                          Invoice Number Format
                        </Label>
                        <Select
                          value={companySettings.invoice_number_type}
                          onValueChange={(value: 'date' | 'incremental') => handleInvoiceNumberTypeChange(value)}
                        >
                          <SelectTrigger className="input-field w-full">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="incremental">Incremental (e.g. INV-0001)</SelectItem>
                            <SelectItem value="date">Date-based (e.g. INV-20240825)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground mt-1">
                          Choose how your invoice numbers should be generated
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-border flex justify-end">
                    <button 
                      type="button" 
                      className="apple-button"
                      onClick={handleSaveCompany}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : 'Save Invoice Settings'}
                    </button>
                  </div>
                </div>
              </CustomCard>
            )}
            
            {activeTab === 'security' && (
              <CustomCard>
                <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                <p className="text-muted-foreground">Update your password and configure security settings.</p>
              </CustomCard>
            )}
            
            {activeTab === 'notifications' && (
              <CustomCard>
                <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                <p className="text-muted-foreground">Customize when and how you receive notifications.</p>
              </CustomCard>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
