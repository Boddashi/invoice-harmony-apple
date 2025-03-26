import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
import { generateCreditNotePDF } from '@/utils/creditNotePdfGenerator';

export interface CreditNoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  vat_rate: string;
}

export interface Client {
  id: string;
  name: string;
  type?: string;
  email?: string;
  [key: string]: any;
}

export interface Item {
  id: string;
  title: string;
  price: number;
  vat: string;
}

export interface Vat {
  title: string;
  amount: number | null;
}

export interface VatGroup {
  rate: string;
  value: number;
  amount: number;
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
  const [issueDate, setIssueDate] = useState<string>(() => {
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
  const [vats, setVats] = useState<Vat[]>([
    { title: '0%', amount: null },
    { title: '9%', amount: null },
    { title: '21%', amount: null },
    { title: 'Exempt', amount: null },
  ]);
  const [companySettings, setCompanySettings] = useState<any | null>(null);
  
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  
  const total = -Math.abs(items.reduce((sum, item) => sum + item.amount, 0));

  useEffect(() => {
    const fetchCompanySettings = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('company_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error("Error fetching company settings:", error);
        }

        if (data) {
          setCompanySettings(data);
        }
      } catch (error) {
        console.error("Unexpected error fetching company settings:", error);
      }
    };

    fetchCompanySettings();
  }, [user?.id, supabase]);

  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name')
          .eq('user_id', user.id);

        if (error) throw error;
        setClients(data || []);
      } catch (error: any) {
        console.error('Error fetching clients:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to load clients',
        });
      }
    };

    fetchClients();
  }, [user, toast]);

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
    await handleSubmit('draft');
  }, []);

  const handleCreateAndSend = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    await handleSubmit('pending');
  }, []);
  
  const handleCreateAndSendYuki = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    await handleSubmit('pending', true);
  }, []);

  const generateCreditNoteNumber = async () => {
    const prefix = 'CN';
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomNumber}`;
  };

  const submitToStorecove = useCallback(async (creditNoteId: string, pdfData: { base64: string, url?: string }) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.functions.invoke('submit-credit-note-document', {
        body: {
          creditNoteId: creditNoteId,
        }
      });

      if (error) {
        console.error('Storecove submission error:', error);
        toast({
          variant: 'destructive',
          title: 'Storecove Submission Failed',
          description: error.message || 'Failed to submit credit note to Storecove.',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Credit note submitted to Storecove successfully!',
        });
      }
    } catch (error: any) {
      console.error('Error submitting to Storecove:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to submit credit note to Storecove.',
      });
    }
  }, [user, selectedClientId, toast]);

  const handleDownloadPDF = useCallback(async () => {
    if (!creditNoteId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Credit note ID is missing.',
      });
      return;
    }

    try {
      setIsGeneratingPDF(true);
      
      const { data } = supabase.storage
        .from('credit_notes')
        .getPublicUrl(`${creditNoteId}/credit-note.pdf`);
        
      if (data && data.publicUrl) {
        window.open(data.publicUrl, '_blank');
      } else {
        throw new Error('PDF URL not found.');
      }
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to download PDF.',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [creditNoteId, toast]);

  const handleSubmit = useCallback(async (newStatus?: CreditNoteStatus, sendToYuki: boolean = false) => {
    if (!user || !selectedClientId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please log in and select a client.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const statusToUse: CreditNoteStatus = newStatus || status;
      
      const creditNoteData = {
        credit_note_number: creditNoteNumber,
        client_id: selectedClientId,
        issue_date: issueDate,
        status: statusToUse,
        notes: notes,
        amount: total,
        total_amount: total,
        user_id: user.id,
      };

      let creditNoteIdToUse = creditNoteId;

      if (creditNoteId) {
        const { error } = await supabase
          .from('credit_notes')
          .update(creditNoteData)
          .eq('id', creditNoteId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('credit_notes')
          .insert([creditNoteData])
          .select('id');

        if (error) throw error;

        creditNoteIdToUse = data[0].id;
        setCreditNoteId(creditNoteIdToUse);
      }

      const creditNoteItemsData = items.map(item => ({
        credit_note_id: creditNoteIdToUse,
        item_id: item.id,
        quantity: item.quantity,
        total_amount: item.quantity * item.unit_price,
      }));

      if (creditNoteId) {
        const { error: deleteError } = await supabase
          .from('credit_note_items')
          .delete()
          .eq('credit_note_id', creditNoteId);

        if (deleteError) throw deleteError;
      }

      const { error: insertItemsError } = await supabase
        .from('credit_note_items')
        .insert(creditNoteItemsData);

      if (insertItemsError) throw insertItemsError;

      setIsGeneratingPDF(true);
      const { error: generatePdfError } = await supabase.functions.invoke('generate-pdf', {
        body: {
          creditNoteId: creditNoteIdToUse,
          type: 'credit_note'
        }
      });

      if (generatePdfError) throw generatePdfError;
      setPdfGenerated(true);

      const { data: urlData } = supabase.storage
        .from('credit_notes')
        .getPublicUrl(`${creditNoteIdToUse}/credit-note.pdf`);

      if (urlData && urlData.publicUrl) {
        setPdfUrl(urlData.publicUrl);
      }

      if (statusToUse === 'pending' || status === 'pending') {
        setIsSubmittingToStorecove(true);

        const { error: submitError } = await supabase.functions.invoke('submit-credit-note-document', {
          body: {
            creditNoteId: creditNoteIdToUse,
          }
        });

        if (submitError) {
          console.error('Storecove submission error:', submitError);
          toast({
            variant: 'destructive',
            title: 'Storecove Submission Failed',
            description: submitError.message || 'Failed to submit credit note to Storecove.',
          });
        } else {
          toast({
            title: 'Success',
            description: 'Credit note submitted to Storecove successfully!',
          });
        }
      }

      if (sendToYuki) {
        setIsSendingToYuki(true);

        const { error: yukiError } = await supabase.functions.invoke('send-yuki', {
          body: {
            creditNoteId: creditNoteIdToUse,
            type: 'credit_note'
          }
        });

        if (yukiError) {
          console.error('Yuki submission error:', yukiError);
          toast({
            variant: 'destructive',
            title: 'Yuki Submission Failed',
            description: yukiError.message || 'Failed to submit credit note to Yuki.',
          });
        } else {
          toast({
            title: 'Success',
            description: 'Credit note submitted to Yuki successfully!',
          });
        }
      }

      toast({
        title: 'Success',
        description: 'Credit note saved successfully!',
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
  }, [user, selectedClientId, status, toast, navigate]);

  const handleAddClient = useCallback(async (clientData: any) => {
    if (!user) return null;
    
    try {
      const newClient = {
        ...clientData,
        user_id: user.id,
        name: clientData.name || 'New Client',
        email: clientData.email || '',
        type: clientData.type || 'business'
      };
      
      const { data, error } = await supabase
        .from('clients')
        .insert(newClient)
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setSelectedClientId(data[0].id);
        setClients(prevClients => [...prevClients, data[0]]);
        
        toast({
          title: 'Success',
          description: 'Client added successfully.',
        });
        
        return data[0];
      }
      
      return null;
    } catch (error: any) {
      console.error('Error adding client:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add client.',
      });
      return null;
    }
  }, [user, toast]);
  
  return {
    isEditMode,
    isLoading,
    isSubmitting,
    isGeneratingPDF,
    isSendingEmail,
    isSubmittingToStorecove,
    isSendingToYuki,
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
    pdfGenerated,
    creditNoteId,
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
    handleCreateAndSendYuki,
    handleSubmit,
    getVatGroups,
    fetchAvailableItems
  };
}
