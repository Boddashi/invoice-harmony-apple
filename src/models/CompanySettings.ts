
export interface CompanySettings {
  id?: string;
  user_id?: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_website: string;
  vat_number: string;
  street: string;
  number: string;
  bus: string;
  postal_code: string;
  city: string;
  country: string;
  default_currency: string;
  
  // Bank information
  bank_name: string;
  account_number: string;
  swift: string;
  iban: string;
  
  // Invoice settings
  invoice_prefix: string;
  invoice_number_type: 'date' | 'incremental';
  credit_note_prefix: string;
  
  // Yuki integration
  yuki_email?: string;
  
  // Company logo
  logo_url: string;
  
  // Terms & Conditions
  terms_and_conditions_url?: string;
  
  // Legal entity (Storecove)
  legal_entity_id?: number | null;
  
  // PEPPOL identifier
  peppol_identifier?: any;
}

export const defaultCompanySettings: CompanySettings = {
  company_name: '',
  company_email: '',
  company_phone: '',
  company_website: '',
  vat_number: '',
  street: '',
  number: '',
  bus: '',
  postal_code: '',
  city: '',
  country: '',
  default_currency: 'EUR', // Fixed as EUR
  
  bank_name: '',
  account_number: '',
  swift: '',
  iban: '',
  
  invoice_prefix: 'INV',
  invoice_number_type: 'date',
  credit_note_prefix: 'CN',
  
  yuki_email: '',
  
  logo_url: '',
  terms_and_conditions_url: '',
  
  legal_entity_id: null,
  peppol_identifier: null
};
