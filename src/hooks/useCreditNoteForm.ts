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
  const [invoiceNumber, setInvoiceNumber] = useState('');
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
  
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  // Fetch clients
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
  
  // Fetch vats
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
  
  // Fetch company settings
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

  // Fetch existing credit note if in edit mode
  useEffect(() => {
    const fetchCreditNote = async () => {
      if (!user || !id) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Fetch credit note
        const { data: creditNoteData, error: creditNoteError } = await supabase
          .from('credit_notes')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (creditNoteError) throw creditNoteError;
        
        // Fetch credit note items
        const { data: creditNoteItemsData, error: itemsError } = await supabase
          .from('credit_note_items')
          .select(`
            *,
            item:items(*)
          `)
          .eq('credit_note_id', id);
          
        if (itemsError) throw itemsError;
        
        // Update state with fetched data
        if (creditNoteData) {
          setCreditNoteId(creditNoteData.id);
          setInvoiceNumber(creditNoteData.invoice_number);
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
  
  // Initialize invoice number if needed
  useEffect(() => {
    if (!isEditMode && companySettings && !invoiceNumber) {
      // Generate a credit note number based on date format YYYYMMDD
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      
      const prefix = companySettings.invoice_prefix || 'CN';
      const dateCode = `${year}${month}${day}`;
      setInvoiceNumber(`${prefix}${dateCode}`);
    }
  }, [isEditMode, companySettings, invoiceNumber]);

  // Fetch available items
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
  
  // Update item amount when quantity or unit price changes
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
  
  // Handle item changes
  const handleItemDescriptionChange = useCallback((id: string, value: string) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === id) {
          // Find selected item
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
      // Ensure at least one item remains
      if (prevItems.length === 1) {
        return prevItems;
      }
      return prevItems.filter(item => item.id !== id);
    });
  }, []);
  
  // Helper function to calculate VAT groups
  const getVatGroups = useCallback((): VatGroup[] => {
    const groups = new Map<string, VatGroup>();
    
    items.forEach(item => {
      const vatRate = item.vat_rate;
      const amount = item.amount;
      
      // Skip if amount is 0
      if (amount === 0) return;
      
      // Extract numeric VAT percentage if possible
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
    
    return Array.from(groups.values());
  }, [items]);
  
  // Handle save as draft
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
      
      // Calculate totals
      const vatGroups = getVatGroups();
      const subtotal = vatGroups.reduce((sum, group) => sum + group.value, 0);
      const vatTotal = vatGroups.reduce((sum, group) => sum + group.amount, 0);
      const total = subtotal + vatTotal;
      
      // Prepare credit note data
      const creditNoteData = {
        user_id: user.id,
        client_id: selectedClientId,
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        status: 'draft' as CreditNoteStatus,
        amount: subtotal,
        tax_amount: vatTotal,
        total_amount: total,
        notes: notes
      };
      
      let savedCreditNoteId = creditNoteId;
      
      if (isEditMode && id) {
        // Update existing credit note
        const { error: updateError } = await supabase
          .from('credit_notes')
          .update(creditNoteData)
          .eq('id', id);
          
        if (updateError) throw updateError;
        
        savedCreditNoteId = id;
        
        // Delete existing items
        const { error: deleteItemsError } = await supabase
          .from('credit_note_items')
          .delete()
          .eq('credit_note_id', id);
          
        if (deleteItemsError) throw deleteItemsError;
      } else {
        // Insert new credit note
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
      
      // Insert credit note items
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
      
      // Redirect to credit notes page
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
    user, selectedClientId, invoiceNumber, issueDate, notes, items, 
    creditNoteId, isEditMode, id, navigate, getVatGroups, toast
  ]);
  
  // Handle create and send
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
      
      // Calculate totals
      const vatGroups = getVatGroups();
      const subtotal = vatGroups.reduce((sum, group) => sum + group.value, 0);
      const vatTotal = vatGroups.reduce((sum, group) => sum + group.amount, 0);
      const total = subtotal + vatTotal;
      
      // Prepare credit note data
      const creditNoteData = {
        user_id: user.id,
        client_id: selectedClientId,
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        status: 'pending' as CreditNoteStatus,
        amount: subtotal,
        tax_amount: vatTotal,
        total_amount: total,
        notes: notes
      };
      
      let savedCreditNoteId = creditNoteId;
      
      if (isEditMode && id) {
        // Update existing credit note
        const { error: updateError } = await supabase
          .from('credit_notes')
          .update(creditNoteData)
          .eq('id', id);
          
        if (updateError) throw updateError;
        
        savedCreditNoteId = id;
        
        // Delete existing items
        const { error: deleteItemsError } = await supabase
          .from('credit_note_items')
          .delete()
          .eq('credit_note_id', id);
          
        if (deleteItemsError) throw deleteItemsError;
      } else {
        // Insert new credit note
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
      
      // Insert credit note items
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
      
      // Redirect to credit notes page
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
    user, selectedClientId, invoiceNumber, issueDate, notes, items, 
    creditNoteId, isEditMode, id, navigate, getVatGroups, toast
  ]);
  
  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleCreateAndSend(e as unknown as React.MouseEvent);
  }, [handleCreateAndSend]);
  
  // Handle add client
  const handleAddClient = useCallback(async (newClient: Omit<Client, 'id'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...newClient, user_id: user.id })
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
  }, [user, toast]);
  
  // Handle download PDF
  const handleDownloadPDF = useCallback(() => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  }, [pdfUrl]);
  
  // Handle send email
  const handleSendEmail = useCallback(async () => {
    // For now, just log that email would be sent
    toast({
      title: 'Info',
      description: 'Email functionality not implemented for credit notes yet.',
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
    invoiceNumber,
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
    setInvoiceNumber,
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
