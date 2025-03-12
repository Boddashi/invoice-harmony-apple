
import React, { useEffect, useState } from 'react';
import CustomCard from '../ui/CustomCard';
import { supabase } from '@/integrations/supabase/client';
import { CompanySettings } from '@/models/CompanySettings';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
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
      <h3 className="text-lg font-medium mb-4">From</h3>
      
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading company information...</p>
      ) : companySettings ? (
        <div className="space-y-2 text-sm">
          <p className="font-medium">{companySettings.company_name}</p>
          <p>{companySettings.street} {companySettings.number}{companySettings.bus ? `, ${companySettings.bus}` : ''}</p>
          <p>{companySettings.postal_code} {companySettings.city}</p>
          <p>{companySettings.country}</p>
          {companySettings.vat_number && <p>VAT: {companySettings.vat_number}</p>}
          {companySettings.company_email && <p>Email: {companySettings.company_email}</p>}
          {companySettings.company_phone && <p>Phone: {companySettings.company_phone}</p>}
          {companySettings.company_website && <p>Web: {companySettings.company_website}</p>}
        </div>
      ) : (
        <div className="space-y-1">
          <p className="font-medium">{userEmail}</p>
          {!readOnly && (
            <p className="text-muted-foreground text-sm">
              No company details found. Please add them in Settings.
            </p>
          )}
        </div>
      )}
    </CustomCard>
  );
};

export default InvoiceFrom;
