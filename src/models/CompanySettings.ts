
export interface CompanySettings {
  id?: string;
  user_id?: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_website: string;
  vat_number: string;
  default_currency: string;
  street: string;
  number: string;
  bus: string;
  postal_code: string;
  city: string;
  country: string;
  bank_name: string;
  account_number: string;
  swift: string;
  iban: string;
}

export const defaultCompanySettings: CompanySettings = {
  company_name: '',
  company_email: '',
  company_phone: '',
  company_website: '',
  vat_number: '',
  default_currency: 'USD',
  street: '',
  number: '',
  bus: '',
  postal_code: '',
  city: '',
  country: '',
  bank_name: '',
  account_number: '',
  swift: '',
  iban: ''
};
