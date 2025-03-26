import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from './use-toast';
import { generateCreditNotePDF, saveCreditNotePDF } from '@/utils/creditNotePdfGenerator';

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

interface CreditNote {
  id: string;
  client_id: string;
  user_id: string;
  credit_note_number: string;
  issue_date: string;
  status: CreditNoteStatus;
  amount: number;
  tax_rate?: number;
  tax_amount?: number;
  total_amount: number;
  notes?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
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
  const [isSendingToYuki, setIsSendingToYuki] = useState(false);
  
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [creditNoteId, setCreditNoteId] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
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

      console.log("Retrieved credit note data for PDF generation:", {
        id: creditNoteData.id,
        number: creditNoteData.credit_note_number,
        clientName: creditNoteData.client.name,
        itemCount: creditNoteData.items.length
      });

      const formattedItems = creditNoteData.items.map(item => ({
        description: item.item ? item.item.title : 'Unknown Item',
        quantity: item.quantity,
        unit_price: Math.abs(item.total_amount) / item.quantity,
        vat_rate: item.item?.vat || '0%',
        amount: item.total_amount
      }));

      const clientAddress = [
        creditNoteData.client.street ? `${creditNoteData.client.street} ${creditNoteData.client.number || ''}${creditNoteData.client.bus ? ', ' + creditNoteData.client.bus : ''}` : '',
        `${creditNoteData.client.postcode || ''} ${creditNoteData.client.city || ''} ${creditNoteData.client.country ? ', ' + creditNoteData.client.country : ''}`
      ].filter(Boolean).join('\n');

      const pdfData = {
        id: creditNoteData.id,
        credit_note_number: creditNoteData.credit_note_number,
        issue_date: creditNoteData.issue_date,
        client_name: creditNoteData.client.name,
        client_address: clientAddress,
        client_vat: creditNoteData.client.vat_number,
        user_email: user.email || '',
        items: formattedItems,
        subTotal: creditNoteData.amount,
        taxAmount: creditNoteData.tax_amount || 0,
        total: creditNoteData.total_amount,
        notes: creditNoteData.notes,
        currencySymbol: currencySymbol
      };

      console.log("Calling generateCreditNotePDF with data:", {
        id: pdfData.id,
        number: pdfData.credit_note_number,
        itemCount: pdfData.items.length
      });

      const pdfResult = await generateCreditNotePDF(pdfData);
      
      if (!pdfResult || !pdfResult.base64) {
        throw new Error("Failed to generate PDF: No data returned");
      }
      
      if (shouldUpdateStatus) {
        const { error: updateStatusError } = await supabase
          .from('credit_notes')
          .update({ status: 'pending' })
          .eq('id', creditNoteId);
          
        if (updateStatusError) {
          console.error("Error updating credit note status:", updateStatusError);
        }
        
        setStatus('pending');
      }

      const { data: urlData } = supabase.storage
        .from('credit_notes')
        .getPublicUrl(`${creditNoteId}/credit-note.pdf`);
      
      if (urlData && urlData.publicUrl) {
        setPdfUrl(urlData.publicUrl);
      }

      setPdfGenerated(true);
      return pdfResult;
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

  const handleSendEmail = useCallback(async () => {
    if (!user || !selectedClientId || !creditNoteId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot send email without credit note ID or client.',
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
        .eq('id', creditNoteId)
        .single();
        
      if (creditNoteError) throw creditNoteError;
      
      const { data: companyData, error: companyError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (companyError && companyError.code !== 'PGRST116') throw companyError;
      
      let pdfBase64 = null;
      let pdfUrl = null;
      
      if (!pdfGenerated) {
        const pdfResult = await generatePDF(creditNoteId, false);
        if (pdfResult) {
          pdfBase64 = pdfResult.base64;
        } else {
          throw new Error("Failed to generate PDF for credit note");
        }
      }
      
      const { data: urlData } = supabase.storage
        .from('credit_notes')
        .getPublicUrl(`${creditNoteId}/credit-note.pdf`);

      if (urlData && urlData.publicUrl) {
        pdfUrl = urlData.publicUrl;
      }
      
      if (!pdfUrl && !pdfBase64) {
        throw new Error("Unable to get PDF for credit note");
      }
      
      const emailData = {
        clientName: clientData.name,
        clientEmail: clientData.email,
        invoiceNumber: creditNoteData.credit_note_number,
        pdfUrl: pdfUrl,
        termsAndConditionsUrl: companyData?.terms_and_conditions_url || null,
        companyName: companyData?.company_name || "PowerPeppol",
        includeAttachments: true,
        pdfBase64: pdfBase64,
        yukiEmail: companyData?.yuki_email,
        isCreditNote: true
      };
      
      console.log("Sending credit note email with data:", {
        to: clientData.email,
        creditNoteNumber: creditNoteData.credit_note_number,
        hasAttachment: !!pdfBase64 || !!pdfUrl,
        yukiCopy: !!companyData?.yuki_email
      });
      
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
  }, [user, selectedClientId, creditNoteId, toast, pdfGenerated, generatePDF]);

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
          const typedCreditNoteData = creditNoteData as CreditNote;
          
          setCreditNoteId(typedCreditNoteData.id);
          setCreditNoteNumber(typedCreditNoteData.credit_note_number);
          setIssueDate(typedCreditNoteData.issue_date);
          setSelectedClientId(typedCreditNoteData.client_id);
          const fetchedStatus = typedCreditNoteData.status as string;
          setStatus(fetchedStatus === 'overdue' ? 'pending' : fetchedStatus as CreditNoteStatus);
          setNotes(typedCreditNoteData.notes || '');
          
          if (typedCreditNoteData.pdf_url) {
            setPdfUrl(typedCreditNoteData.pdf_url);
            setPdfGenerated(true);
          }
          
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
  
  const submitToStorecove = useCallback(async (creditNoteId: string, pdfData: { base64: string, url?: string }) => {
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
      
      let pdfUrl = pdfData.url;
      if (!pdfUrl) {
        const { data: urlData } = supabase.storage
          .from('credit_notes')
          .getPublicUrl(`${creditNoteId}/credit-note.pdf`);
          
        if (urlData && urlData.publicUrl) {
          pdfUrl = urlData.publicUrl;
        }
      }
      
      const formattedItems = creditNoteData.items.map((item: any) => ({
        description: item.item ? item.item.title : 'Unknown Item',
        quantity: item.quantity,
        unit_price: Math.abs(item.total_amount) / item.quantity,
        amount: -Math.abs(item.total_amount),
        vat_rate: item.item?.vat || '21%'
      }));
      
      console.log('Submitting credit note to edge function with data:', {
        creditNoteId: creditNoteData.id,
        creditNoteNumber: creditNoteData.credit_note_number,
        clientId: clientData.id,
        clientName: clientData.name,
        itemCount: formattedItems.length,
        hasPdfBase64: !!pdfData.base64,
        hasPdfUrl: !!pdfUrl
      });
      
      const { data: submissionResult, error: submissionError } = await supabase
        .functions
        .invoke('submit-credit-note-document', {
          body: {
            creditNote: creditNoteData,
            client: clientData,
            items: formattedItems,
            companySettings: companyData,
            pdfBase64: pdfData.base64,
            pdfUrl: pdfUrl
          }
        });
        
      if (submissionError) {
        console.error('Error from edge function:', submissionError);
        throw submissionError;
      }
      
      console.log('Edge function response:', submissionResult);
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
  }, [user, selectedClientId, supabase, toast]);
  
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

      console.log('Generating PDF for credit note ID:', savedCreditNoteId);
      const pdfData = await generatePDF(savedCreditNoteId, false);
      
      if (pdfData) {
        console.log('PDF generated successfully');
        
        const { error: updateError } = await supabase
          .from('credit_notes')
          .update({
            status: 'pending'
          })
          .eq('id', savedCreditNoteId);
          
        if (updateError) throw updateError;
        
        setStatus('pending');
        setPdfGenerated(true);
        
        // Submit the
