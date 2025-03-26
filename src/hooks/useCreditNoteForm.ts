import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from './use-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  legal_entity_id?: number | null;
  type: string;
  [key: string]: any;
}

interface Item {
  id: string;
  title: string;
  price: number;
  vat: string;
}

interface CreditNoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  vat_rate: string;
}

interface Vat {
  title: string;
  amount: number | null;
}

interface VatGroup {
  rate: string;
  value: number;
  amount: number;
}

interface CompanySettings {
  company_name?: string;
  company_email?: string;
  company_phone?: string;
  company_website?: string;
  street?: string;
  number?: string;
  bus?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  vat_number?: string;
  iban?: string;
  swift?: string;
  bank_name?: string;
  logo_url?: string;
  legal_entity_id?: number | null;
  terms_and_conditions_url?: string;
  yuki_email?: string;
  invoice_prefix?: string;
  credit_note_prefix?: string;
  [key: string]: any;
}

type CreditNoteStatus = 'draft' | 'pending' | 'paid';

export function useCreditNoteForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { currencySymbol } = useCurrency();
  const { toast } = useToast();
  
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSubmittingToStorecove, setIsSubmittingToStorecove] = useState(false);
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [creditNoteId, setCreditNoteId] = useState<string>('');
  const [creditNoteNumber, setCreditNoteNumber] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [issueDate, setIssueDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [status, setStatus] = useState<CreditNoteStatus>('draft');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CreditNoteItem[]>([
    {
      id: uuidv4(),
      description: '',
      quantity: 1,
      unit_price: 0,
      amount: 0,
      vat_rate: '21%',
    },
  ]);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [vats, setVats] = useState<Vat[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  
  const total = -Math.abs(items.reduce((sum, item) => sum + item.amount, 0));

  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) throw error;
        setClients(data || []);
      } catch (error: any) {
        console.error('Error fetching clients:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to fetch clients.',
        });
      }
    };
    
    fetchClients();
  }, [user, toast]);
  
  useEffect(() => {
    const fetchVats = async () => {
      try {
        const { data, error } = await supabase
          .from('vats')
          .select('*');
          
        if (error) throw error;
        setVats(data || []);
      } catch (error: any) {
        console.error('Error fetching vats:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to fetch VAT rates.',
        });
      }
    };
    
    fetchVats();
  }, [toast]);
  
  useEffect(() => {
    const fetchCompanySettings = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('company_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') throw error;
        setCompanySettings(data || null);
      } catch (error: any) {
        console.error('Error fetching company settings:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to fetch company settings.',
        });
      }
    };
    
    fetchCompanySettings();
  }, [user, toast]);

  useEffect(() => {
    const fetchCreditNote = async () => {
      if (!user || !id) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        const { data: creditNoteData, error: creditNoteError } = await supabase
          .from('credit_notes')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (creditNoteError) throw creditNoteError;
        
        const { data: creditNoteItemsData, error: itemsError } = await supabase
          .from('credit_note_items')
          .select(`
            *,
            item:items(*)
          `)
          .eq('credit_note_id', id);
          
        if (itemsError) throw itemsError;
        
        if (creditNoteData) {
          setCreditNoteId(creditNoteData.id);
          setCreditNoteNumber(creditNoteData.credit_note_number);
          setIssueDate(creditNoteData.issue_date);
          setSelectedClientId(creditNoteData.client_id);
          const fetchedStatus = creditNoteData.status as string;
          setStatus(fetchedStatus === 'overdue' ? 'pending' : fetchedStatus as CreditNoteStatus);
          setNotes(creditNoteData.notes || '');
          
          if (creditNoteItemsData && creditNoteItemsData.length > 0) {
            const formattedItems = creditNoteItemsData.map((item: any) => ({
              id: uuidv4(),
              description: item.item_id,
              quantity: item.quantity,
              unit_price: item.total_amount / item.quantity,
              amount: item.total_amount,
              vat_rate: item.item?.vat || '21%',
            }));
            
            setItems(formattedItems);
          }
        }
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error fetching credit note data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to fetch credit note data.',
        });
        setIsLoading(false);
      }
    };
    
    fetchCreditNote();
  }, [user, id, toast]);
  
  useEffect(() => {
    if (!isEditMode && companySettings && !creditNoteNumber) {
      generateCreditNoteNumber();
    }
  }, [isEditMode, companySettings, creditNoteNumber]);

  const generateCreditNoteNumber = async () => {
    if (!user || !companySettings) return;
    
    try {
      const prefix = companySettings.credit_note_prefix || 'CN';
      
      const { data, error } = await supabase
        .from('credit_notes')
        .select('credit_note_number')
        .eq('user_id', user.id)
        .ilike('credit_note_number', `${prefix}-%`)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      let nextNumber = 1;
      
      if (data && data.length > 0) {
        const lastCreditNoteNumber = data[0].credit_note_number;
        const lastNumberStr = lastCreditNoteNumber.split('-')[1];
        
        if (lastNumberStr && !isNaN(parseInt(lastNumberStr))) {
          nextNumber = parseInt(lastNumberStr) + 1;
        }
      }
      
      const formattedNumber = String(nextNumber).padStart(5, '0');
      setCreditNoteNumber(`${prefix}-${formattedNumber}`);
      
    } catch (error: any) {
      console.error('Error generating credit note number:', error);
      const prefix = companySettings.credit_note_prefix || 'CN';
      setCreditNoteNumber(`${prefix}-00001`);
    }
  };

  const fetchAvailableItems = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      setAvailableItems(data || []);
    } catch (error: any) {
      console.error('Error fetching items:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fetch items.',
      });
    }
  }, [user, toast]);
  
  useEffect(() => {
    fetchAvailableItems();
  }, [fetchAvailableItems]);
  
  useEffect(() => {
    const updatedItems = items.map(item => {
      const amount = Number(item.quantity) * Number(item.unit_price);
      return {
        ...item,
        amount: amount
      };
    });
    
    setItems(updatedItems);
  }, [items.map(item => `${item.quantity}-${item.unit_price}`)]);
  
  const handleItemDescriptionChange = useCallback((id: string, value: string) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === id) {
          const selectedItem = availableItems.find(i => i.id === value);
          
          if (selectedItem) {
            return {
              ...item,
              description: value,
              unit_price: selectedItem.price,
              vat_rate: selectedItem.vat,
              amount: selectedItem.price * item.quantity
            };
          }
          
          return {
            ...item,
            description: value
          };
        }
        return item;
      });
    });
  }, [availableItems]);
  
  const handleItemQuantityChange = useCallback((id: string, value: number) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === id) {
          const amount = value * item.unit_price;
          return {
            ...item,
            quantity: value,
            amount
          };
        }
        return item;
      });
    });
  }, []);
  
  const handleItemUnitPriceChange = useCallback((id: string, value: number) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === id) {
          const amount = item.quantity * value;
          return {
            ...item,
            unit_price: value,
            amount
          };
        }
        return item;
      });
    });
  }, []);
  
  const handleItemVatChange = useCallback((id: string, value: string) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === id) {
          return {
            ...item,
            vat_rate: value
          };
        }
        return item;
      });
    });
  }, []);
  
  const handleAddItem = useCallback(() => {
    setItems(prevItems => [
      ...prevItems,
      {
        id: uuidv4(),
        description: '',
        quantity: 1,
        unit_price: 0,
        amount: 0,
        vat_rate: '21%'
      }
    ]);
  }, []);
  
  const handleRemoveItem = useCallback((id: string) => {
    setItems(prevItems => {
      if (prevItems.length === 1) {
        return prevItems;
      }
      return prevItems.filter(item => item.id !== id);
    });
  }, []);
  
  const getVatGroups = useCallback((): VatGroup[] => {
    const groups = new Map<string, VatGroup>();
    
    items.forEach(item => {
      const vatRate = item.vat_rate;
      const amount = item.amount;
      
      if (amount === 0) return;
      
      let vatPercentage = 0;
      if (vatRate !== 'Exempt' && vatRate !== 'exempt') {
        vatPercentage = parseFloat(vatRate) || 0;
      }
      
      const vatAmount = vatRate === 'Exempt' || vatRate === 'exempt' 
        ? 0 
        : (amount * vatPercentage) / 100;
      
      if (groups.has(vatRate)) {
        const group = groups.get(vatRate)!;
        group.value += amount;
        group.amount += vatAmount;
      } else {
        groups.set(vatRate, {
          rate: vatRate,
          value: amount,
          amount: vatAmount
        });
      }
    });
    
    return Array.from(groups.values()).map(group => ({
      ...group,
      value: -Math.abs(group.value),
      amount: -Math.abs(group.amount)
    }));
  }, [items]);
  
  const handleSaveAsDraft = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!user || !selectedClientId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a client before saving.',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const vatGroups = getVatGroups();
      const subtotal = -Math.abs(vatGroups.reduce((sum, group) => sum + Math.abs(group.value), 0));
      const vatTotal = -Math.abs(vatGroups.reduce((sum, group) => sum + Math.abs(group.amount), 0));
      const totalAmount = subtotal + vatTotal;
      
      const creditNoteData = {
        user_id: user.id,
        client_id: selectedClientId,
        credit_note_number: creditNoteNumber,
        issue_date: issueDate,
        status: 'draft' as CreditNoteStatus,
        amount: subtotal,
        tax_amount: vatTotal,
        total_amount: totalAmount,
        notes: notes
      };
      
      let savedCreditNoteId = creditNoteId;
      
      if (isEditMode && id) {
        const { error: updateError } = await supabase
          .from('credit_notes')
          .update(creditNoteData)
          .eq('id', id);
          
        if (updateError) throw updateError;
        
        savedCreditNoteId = id;
        
        const { error: deleteItemsError } = await supabase
          .from('credit_note_items')
          .delete()
          .eq('credit_note_id', id);
          
        if (deleteItemsError) throw deleteItemsError;
      } else {
        const { data, error } = await supabase
          .from('credit_notes')
          .insert(creditNoteData)
          .select();
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          savedCreditNoteId = data[0].id;
          setCreditNoteId(savedCreditNoteId);
        }
      }
      
      const itemsToInsert = items
        .filter(item => item.description)
        .map(item => ({
          credit_note_id: savedCreditNoteId,
          item_id: item.description,
          quantity: item.quantity,
          total_amount: item.amount
        }));
      
      if (itemsToInsert.length > 0) {
        const { error: insertItemsError } = await supabase
          .from('credit_note_items')
          .insert(itemsToInsert);
          
        if (insertItemsError) throw insertItemsError;
      }
      
      toast({
        title: 'Success',
        description: `Credit note saved as draft.`,
      });
      
      navigate('/creditnotes');
    } catch (error: any) {
      console.error('Error saving credit note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save credit note.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    user, selectedClientId, creditNoteNumber, issueDate, notes, items, 
    creditNoteId, isEditMode, id, navigate, getVatGroups, toast
  ]);
  
  const generatePDF = useCallback(async (creditNoteId: string, shouldUpdateStatus = true) => {
    if (!user) return null;

    try {
      setIsGeneratingPDF(true);

      const { data: creditNoteData, error: creditNoteError } = await supabase
        .from('credit_notes')
        .select(`
          *,
          client:clients(*),
          items:credit_note_items(*, item:items(*))
        `)
        .eq('id', creditNoteId)
        .single();

      if (creditNoteError) throw creditNoteError;

      const { data: companyData, error: companyError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (companyError && companyError.code !== 'PGRST116') throw companyError;

      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
              .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .logo { max-width: 200px; max-height: 80px; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; color: #FF3B30; }
              .info-section { margin-bottom: 20px; }
              .label { font-weight: bold; margin-bottom: 3px; color: #666; }
              .value { margin-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background-color: #f8f9fa; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
              td { padding: 10px; border-bottom: 1px solid #ddd; }
              .amount { text-align: right; }
              .total { font-weight: bold; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
              .credit-note-label { color: #FF3B30; font-weight: bold; }
              .negative-amount { color: #FF3B30; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                ${companyData?.logo_url ? `<img src="${companyData.logo_url}" class="logo" alt="Company Logo">` : ''}
                <div style="margin-top: 10px;">
                  <div><strong>${companyData?.company_name || 'Your Company'}</strong></div>
                  <div>${companyData?.street || ''} ${companyData?.number || ''} ${companyData?.bus ? ', ' + companyData.bus : ''}</div>
                  <div>${companyData?.postal_code || ''} ${companyData?.city || ''} ${companyData?.country ? ', ' + companyData.country : ''}</div>
                  ${companyData?.vat_number ? `<div>VAT: ${companyData.vat_number}</div>` : ''}
                </div>
              </div>
              <div style="text-align: right;">
                <div class="title">CREDIT NOTE</div>
                <div><strong>Number:</strong> ${creditNoteData.credit_note_number}</div>
                <div><strong>Date:</strong> ${new Date(creditNoteData.issue_date).toLocaleDateString()}</div>
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between;">
              <div class="info-section" style="flex: 1;">
                <div class="label">Bill To:</div>
                <div class="value"><strong>${creditNoteData.client.name}</strong></div>
                <div class="value">${creditNoteData.client.street || ''} ${creditNoteData.client.number || ''} ${creditNoteData.client.bus ? ', ' + creditNoteData.client.bus : ''}</div>
                <div class="value">${creditNoteData.client.postcode || ''} ${creditNoteData.client.city || ''} ${creditNoteData.client.country ? ', ' + creditNoteData.client.country : ''}</div>
                ${creditNoteData.client.vat_number ? `<div class="value">VAT: ${creditNoteData.client.vat_number}</div>` : ''}
              </div>
              
              <div class="info-section" style="flex: 1; text-align: right;">
                <div class="label">Status:</div>
                <div class="value">${creditNoteData.status.toUpperCase()}</div>
                ${companyData?.iban ? `
                <div class="label" style="margin-top: 15px;">Bank Account:</div>
                <div class="value">${companyData.iban}</div>
                ${companyData?.bank_name ? `<div class="value">${companyData.bank_name}</div>` : ''}
                ${companyData?.swift ? `<div class="value">BIC/SWIFT: ${companyData.swift}</div>` : ''}
                ` : ''}
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>VAT</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${creditNoteData.items.map(item => `
                  <tr>
                    <td>${item.item ? item.item.title : 'Unknown Item'}</td>
                    <td>${item.quantity}</td>
                    <td>${currencySymbol}${(item.total_amount / item.quantity).toFixed(2)}</td>
                    <td>${item.item?.vat || '0%'}</td>
                    <td class="amount negative-amount">-${currencySymbol}${Math.abs(item.total_amount).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="margin-left: auto; width: 300px; margin-top: 20px;">
              <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                <div>Subtotal:</div>
                <div class="negative-amount">-${currencySymbol}${Math.abs(creditNoteData.amount).toFixed(2)}</div>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                <div>Tax:</div>
                <div class="negative-amount">-${currencySymbol}${Math.abs(creditNoteData.tax_amount || 0).toFixed(2)}</div>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #ddd; font-weight: bold;">
                <div>Total:</div>
                <div class="negative-amount">-${currencySymbol}${Math.abs(creditNoteData.total_amount).toFixed(2)}</div>
              </div>
            </div>
            
            ${creditNoteData.notes ? `
            <div style="margin-top: 30px;">
              <div class="label">Notes:</div>
              <div class="value">${creditNoteData.notes}</div>
            </div>
            ` : ''}
            
            <div class="footer">
              <p>This is a credit note for services or goods previously invoiced.</p>
              ${companyData?.terms_and_conditions_url ? `
              <p><a href="${companyData.terms_and_conditions_url}" target="_blank">View our Terms and Conditions</a></p>
              ` : ''}
              <p>${companyData?.company_name || 'Your Company'} - ${companyData?.company_email || ''} ${companyData?.company_phone ? '- ' + companyData.company_phone : ''}</p>
            </div>
          </body>
        </html>
      `;

      const { data: pdfResult, error: pdfError } = await supabase
        .functions
        .invoke('generate-pdf', {
          body: { html, filename: `credit-note-${creditNoteData.credit_note_number}.pdf` }
        });

      if (pdfError) throw pdfError;

      if (pdfResult?.url) {
        setPdfUrl(pdfResult.url);

        if (shouldUpdateStatus) {
          const { error: updateError } = await supabase
            .from('credit_notes')
            .update({
              pdf_url: pdfResult.url,
              status: 'pending'
            })
            .eq('id', creditNoteId);

          if (updateError) throw updateError;
          
          setStatus('pending');
        }

        return { url: pdfResult.url, base64: pdfResult.base64 };
      }

      throw new Error('Failed to generate PDF: No URL returned');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to generate credit note PDF.',
      });
      return null;
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [user, currencySymbol, toast]);

  const submitToStorecove = useCallback(async (creditNoteId: string, pdfData: { url: string; base64: string }) => {
    if (!user || !selectedClientId) return null;
    
    try {
      setIsSubmittingToStorecove(true);
      
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', selectedClientId)
        .single();
        
      if (clientError) throw clientError;
      
      const { data: creditNoteData, error: creditNoteError } = await supabase
        .from('credit_notes')
        .select(`
          *,
          items:credit_note_items(
            id,
            item_id,
            quantity,
            total_amount,
            item:items(*)
          )
        `)
        .eq('id', creditNoteId)
        .single();
        
      if (creditNoteError) throw creditNoteError;
      
      const { data: companyData, error: companyError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (companyError && companyError.code !== 'PGRST116') throw companyError;
      
      const formattedItems = creditNoteData.items.map((item: any) => ({
        id: item.id,
        description: item.item_id,
        quantity: item.quantity,
        unit_price: item.total_amount / item.quantity,
        amount: -Math.abs(item.total_amount),
        vat_rate: item.item?.vat || '21%'
      }));
      
      const { data: submissionResult, error: submissionError } = await supabase
        .functions
        .invoke('submit-credit-note-document', {
          body: {
            creditNote: creditNoteData,
            client: clientData,
            items: formattedItems,
            companySettings: companyData,
            pdfBase64: pdfData.base64,
            pdfUrl: pdfData.url
          }
        });
        
      if (submissionError) throw submissionError;
      
      return submissionResult;
    } catch (error: any) {
      console.error('Error submitting to Storecove:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to submit credit note to Storecove.',
      });
      return null;
    } finally {
      setIsSubmittingToStorecove(false);
    }
  }, [user, selectedClientId]);
  
  const handleCreateAndSend = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!user || !selectedClientId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a client before sending.',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const vatGroups = getVatGroups();
      const subtotal = -Math.abs(vatGroups.reduce((sum, group) => sum + Math.abs(group.value), 0));
      const vatTotal = -Math.abs(vatGroups.reduce((sum, group) => sum + Math.abs(group.amount), 0));
      const totalAmount = subtotal + vatTotal;
      
      const creditNoteData = {
        user_id: user.id,
        client_id: selectedClientId,
        credit_note_number: creditNoteNumber,
        issue_date: issueDate,
        status: 'pending' as CreditNoteStatus,
        amount: subtotal,
        tax_amount: vatTotal,
        total_amount: totalAmount,
        notes: notes
      };
      
      let savedCreditNoteId = creditNoteId;
      
      if (isEditMode && id) {
        const { error: updateError } = await supabase
          .from('credit_notes')
          .update(creditNoteData)
          .eq('id', id);
          
        if (updateError) throw updateError;
        
        savedCreditNoteId = id;
        
        const { error: deleteItemsError } = await supabase
          .from('credit_note_items')
          .delete()
          .eq('credit_note_id', id);
          
        if (deleteItemsError) throw deleteItemsError;
      } else {
        const { data, error } = await supabase
          .from('credit_notes')
          .insert(creditNoteData)
          .select();
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          savedCreditNoteId = data[0].id;
          setCreditNoteId(savedCreditNoteId);
        }
      }
      
      const itemsToInsert = items
        .filter(item => item.description)
        .map(item => ({
          credit_note_id: savedCreditNoteId,
          item_id: item.description,
          quantity: item.quantity,
          total_amount: item.amount
        }));
      
      if (itemsToInsert.length > 0) {
        const { error: insertItemsError } = await supabase
          .from('credit_note_items')
          .insert(itemsToInsert);
          
        if (insertItemsError) throw insertItemsError;
      }

      const pdfData = await generatePDF(savedCreditNoteId, false);
      
      if (pdfData) {
        const { error: updateError } = await supabase
          .from('credit_notes')
          .update({
            pdf_url: pdfData.url,
            status: 'pending'
          })
          .eq('id', savedCreditNoteId);
          
        if (updateError) throw updateError;
        
        setStatus('pending');
        
        const storecoveResult = await submitToStorecove(savedCreditNoteId, pdfData);
        
        if (storecoveResult) {
          toast({
            title: 'Success',
            description: `Credit note created and sent.${storecoveResult.emailSent ? ' Email sent successfully.' : ''}`,
          });
        } else {
          toast({
            title: 'Partial Success',
            description: 'Credit note created but not sent to Storecove.',
          });
        }
      }
      
      navigate('/creditnotes');
    } catch (error: any) {
      console.error('Error creating and sending credit note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create and send credit note.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    user, selectedClientId, creditNoteNumber, issueDate, notes, items, 
    creditNoteId, isEditMode, id, navigate, getVatGroups, toast, generatePDF, submitToStorecove
  ]);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleCreateAndSend(e as unknown as React.MouseEvent);
  }, [handleCreateAndSend]);
  
  const handleSendEmail = useCallback(async () => {
    if (!user || !selectedClientId || !pdfUrl) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot send email without PDF or client.',
      });
      return;
    }
    
    try {
      setIsSendingEmail(true);
      
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', selectedClientId)
        .single();
        
      if (clientError) throw clientError;
      
      const { data: creditNoteData, error: creditNoteError } = await supabase
        .from('credit_notes')
        .select('*')
        .eq('id', id)
        .single();
        
      if (creditNoteError) throw creditNoteError;
      
      const { data: companyData, error: companyError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (companyError && companyError.code !== 'PGRST116') throw companyError;
      
      const emailData = {
        clientName: clientData.name,
        clientEmail: clientData.email,
        invoiceNumber: creditNoteData.credit_note_number,
        isCredit: true,
        pdfUrl: pdfUrl,
        termsAndConditionsUrl: companyData?.terms_and_conditions_url || null,
        companyName: companyData?.company_name || "PowerPeppol",
        includeAttachments: true,
        yukiEmail: companyData?.yuki_email
      };
      
      const { data: emailResult, error: emailError } = await supabase
        .functions
        .invoke('send-invoice-email', {
          body: emailData
        });
        
      if (emailError) throw emailError;
      
      toast({
        title: 'Success',
        description: 'Credit note email sent successfully.',
      });
    } catch (error: any) {
      console.error('Error sending credit note email:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send credit note email.',
      });
    } finally {
      setIsSendingEmail(false);
    }
  }, [user, selectedClientId, id, pdfUrl, toast]);
  
  const handleAddClient = useCallback(async (newClient: Omit<Client, 'id'>) => {
    if (!user) return;
    
    try {
      if (!newClient.email || !newClient.name || !newClient.type) {
        throw new Error('Client requires email, name, and type fields');
      }

      const clientData = {
        email: newClient.email,
        name: newClient.name,
        type: newClient.type,
        user_id: user.id,
        ...(newClient.phone && { phone: newClient.phone }),
        ...(newClient.street && { street: newClient.street }),
        ...(newClient.number && { number: newClient.number }),
        ...(newClient.bus && { bus: newClient.bus }),
        ...(newClient.postcode && { postcode: newClient.postcode }),
        ...(newClient.city && { city: newClient.city }),
        ...(newClient.country && { country: newClient.country }),
        ...(newClient.vat_number && { vat_number: newClient.vat_number }),
        ...(newClient.legal_entity_id && { legal_entity_id: newClient.legal_entity_id })
      };

      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setClients(prevClients => [...prevClients, data[0]]);
        setSelectedClientId(data[0].id);
        setIsAddClientModalOpen(false);
        
        toast({
          title: 'Success',
          description: 'Client added successfully.',
        });
      }
    } catch (error: any) {
      console.error('Error adding client:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add client.',
      });
    }
  }, [user, toast, setClients, setSelectedClientId, setIsAddClientModalOpen]);
  
  const handleDownloadPDF = useCallback(() => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  }, [pdfUrl]);
  
  return {
    isEditMode,
    isLoading,
    isSubmitting,
    isGeneratingPDF,
    isSendingEmail,
    isSubmittingToStorecove,
    isAddClientModalOpen,
    creditNoteNumber,
    selectedClientId,
    issueDate,
    status,
    notes,
    items,
    total,
    clients,
    availableItems,
    vats,
    pdfUrl,
    currencySymbol,
    user,
    companySettings,
    
    setIsAddClientModalOpen,
    setCreditNoteNumber,
    setSelectedClientId,
    setIssueDate,
    setNotes,
    handleAddClient,
    handleItemDescriptionChange,
    handleItemQuantityChange,
    handleItemUnitPriceChange,
    handleItemVatChange,
    handleAddItem,
    handleRemoveItem,
    handleDownloadPDF,
    handleSendEmail,
    handleSaveAsDraft,
    handleCreateAndSend,
    handleSubmit,
    getVatGroups,
    fetchAvailableItems
  };
}
