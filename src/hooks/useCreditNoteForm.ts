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
          setCreditNoteNumber(creditNoteData.invoice_number);
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
        .select('invoice_number')
        .eq('user_id', user.id)
        .ilike('invoice_number', `${prefix}-%`)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      let nextNumber = 1;
      
      if (data && data.length > 0) {
        const lastInvoiceNumber = data[0].invoice_number;
        const lastNumberStr = lastInvoiceNumber.split('-')[1];
        
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
        invoice_number: creditNoteNumber,
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
        invoice_number: creditNoteNumber,
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
      
      toast({
        title: 'Success',
        description: `Credit note created and sent.`,
      });
      
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
    creditNoteId, isEditMode, id, navigate, getVatGroups, toast
  ]);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleCreateAndSend(e as unknown as React.MouseEvent);
  }, [handleCreateAndSend]);
  
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
  
  const handleSendEmail = useCallback(() => {
    toast({
      title: "Info",
      description: "Email functionality will be implemented soon.",
    });
  }, [toast]);

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
