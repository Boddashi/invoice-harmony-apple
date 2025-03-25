
import React, { useEffect, useState } from "react";
import CustomCard from "../ui/CustomCard";
import { supabase } from '@/integrations/supabase/client';
import { CompanySettings } from '@/models/CompanySettings';
import { useAuth } from '@/contexts/AuthContext';

interface CreditNoteFromProps {
  userEmail: string | null | undefined;
  readOnly?: boolean;
}

const CreditNoteFrom: React.FC<CreditNoteFromProps> = ({
  userEmail,
  readOnly = false
}) => {
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
    <CustomCard padding="sm" className="p-4">
      <h3 className="text-lg font-medium mb-4">From</h3>
      
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading...</div>
      ) : companySettings ? (
        <div className="text-xs">
          <p className="font-medium">{companySettings.company_name}</p>
          <p className="text-muted-foreground">
            {companySettings.street} {companySettings.number}{companySettings.bus ? `, ${companySettings.bus}` : ''}, 
            {companySettings.postal_code} {companySettings.city}
          </p>
          
          <div className="flex flex-wrap gap-x-4 text-muted-foreground mt-1">
            {companySettings.vat_number && (
              <span>VAT: {companySettings.vat_number}</span>
            )}
            {companySettings.company_phone && (
              <span>☎ {companySettings.company_phone}</span>
            )}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs font-medium">{userEmail}</p>
          {!readOnly && (
            <p className="text-xs text-muted-foreground">
              No company details found
            </p>
          )}
        </div>
      )}
    </CustomCard>
  );
};

export default CreditNoteFrom;
