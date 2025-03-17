
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
  
  // Yuki integration
  yuki_email?: string;
  
  // Company logo
  logo_url: string;
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
  default_currency: 'EUR',
  
  bank_name: '',
  account_number: '',
  swift: '',
  iban: '',
  
  invoice_prefix: 'INV',
  invoice_number_type: 'date',
  
  yuki_email: '',
  
  logo_url: ''
};
