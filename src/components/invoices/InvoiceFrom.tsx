
import React, { useEffect, useState } from 'react';
import CustomCard from '../ui/CustomCard';
import { supabase } from '@/integrations/supabase/client';
import { CompanySettings } from '@/models/CompanySettings';
import { useAuth } from '@/contexts/AuthContext';

interface InvoiceFromProps {
  userEmail: string | null | undefined;
  readOnly?: boolean;
}

const InvoiceFrom: React.FC<InvoiceFromProps> = ({ userEmail, readOnly = false }) => {
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCompanySettings = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('company_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching company settings:', error);
          return;
        }
        
        setCompanySettings(data as CompanySettings);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCompanySettings();
  }, [user]);

  return (
    <CustomCard>
      <h3 className="text-lg font-medium mb-3">From</h3>
      
      {isLoading ? (
        <div className="py-2 text-sm text-muted-foreground">Loading...</div>
      ) : companySettings ? (
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-base">{companySettings.company_name}</p>
          <p className="text-muted-foreground">{companySettings.street} {companySettings.number}{companySettings.bus ? `, ${companySettings.bus}` : ''}</p>
          <p className="text-muted-foreground">{companySettings.postal_code} {companySettings.city}, {companySettings.country}</p>
          
          <div className="pt-1 flex flex-col space-y-0.5">
            {companySettings.vat_number && <p className="text-xs text-muted-foreground">VAT: {companySettings.vat_number}</p>}
            {companySettings.company_email && <p className="text-xs text-muted-foreground">Email: {companySettings.company_email}</p>}
            {companySettings.company_phone && <p className="text-xs text-muted-foreground">Phone: {companySettings.company_phone}</p>}
            {companySettings.company_website && <p className="text-xs text-muted-foreground">Web: {companySettings.company_website}</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="font-medium">{userEmail}</p>
          {!readOnly && (
            <p className="text-xs text-muted-foreground">
              No company details found. Please add them in Settings.
            </p>
          )}
        </div>
      )}
    </CustomCard>
  );
};

export default InvoiceFrom;
