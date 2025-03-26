import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from '@/contexts/CurrencyContext';

interface Item {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: string;
}

interface Client {
  id: string;
  name: string;
}

interface AvailableItem {
  id: string;
  title: string;
  price: number;
  vat: string;
}

interface Vat {
  value: string;
  label: string;
}

export function useCreditNoteForm() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSubmittingToStorecove, setIsSubmittingToStorecove] = useState(false);
  const [isSendingToYuki, setIsSendingToYuki] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [creditNoteNumber, setCreditNoteNumber] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  const [status, setStatus] = useState<'draft' | 'pending' | 'paid'>('draft');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [vats, setVats] = useState<Vat[]>([
    { value: '0', label: '0%' },
    { value: '9', label: '9%' },
    { value: '21', label: '21%' },
    { value: 'Exempt', label: 'Exempt' },
  ]);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [creditNoteId, setCreditNoteId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  const [searchParams] = useSearchParams();
	const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [companySettings, setCompanySettings] = useState<any>(null);

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
		const edit = searchParams.get('edit');
		if (edit === 'true') {
			setIsEditMode(true);
		}

    if (id && user) {
      fetchCreditNoteData(id, user.id);
    } else {
      setCreditNoteNumber(generateCreditNoteNumber());
    }
  }, [id, user, searchParams]);

  const generateCreditNoteNumber = () => {
    const prefix = 'CN';
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomNumber}`;
  };

  const fetchCreditNoteData = async (creditNoteId: string, userId: string) => {
    setIsLoading(true);
    try {
      const { data: creditNote, error: creditNoteError } = await supabase
        .from('credit_notes')
        .select('*')
        .eq('id', creditNoteId)
        .eq('user_id', userId)
        .single();

      if (creditNoteError) throw creditNoteError;

      setCreditNoteNumber(creditNote.credit_note_number);
      setSelectedClientId(creditNote.client_id);
      setIssueDate(new Date(creditNote.issue_date));
      setStatus(creditNote.status);
      setNotes(creditNote.notes || '');
      setTotal(creditNote.total_amount);
      setCreditNoteId(creditNoteId);

      const { data: creditNoteItems, error: itemsError } = await supabase
        .from('credit_note_items')
        .select(`
          *,
          item:items(*)
        `)
        .eq('credit_note_id', creditNoteId);

      if (itemsError) throw itemsError;

      const formattedItems = creditNoteItems.map(item => ({
        id: item.item_id,
        description: item.item.title || item.item_id,
        quantity: item.quantity,
        unit_price: Math.abs(item.total_amount) / item.quantity,
        vat_rate: item.item.vat,
      }));

      setItems(formattedItems);

      const { data: urlData } = supabase.storage
        .from('credit_notes')
        .getPublicUrl(`${creditNoteId}/credit-note.pdf`);
        
      if (urlData && urlData.publicUrl) {
        setPdfUrl(urlData.publicUrl);
        setPdfGenerated(true);
      }

    } catch (error: any) {
      console.error('Error fetching credit note data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load credit note data',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      console.error('Error fetching available items:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load items',
      });
    }
  }, [user, toast]);

  useEffect(() => {
    fetchAvailableItems();
  }, [fetchAvailableItems]);

  const handleItemDescriptionChange = (id: string, description: string) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, description } : item
      )
    );
  };

  const handleItemQuantityChange = (id: string, quantity: number) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleItemUnitPriceChange = (id: string, unit_price: number) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, unit_price } : item
      )
    );
  };

  const handleItemVatChange = (id: string, vat_rate: string) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, vat_rate } : item
      )
    );
  };

  const handleAddItem = () => {
    setItems(currentItems => [
      ...currentItems,
      {
        id: uuidv4(),
        description: '',
        quantity: 1,
        unit_price: 0,
        vat_rate: '0',
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  useEffect(() => {
    // Calculate the total whenever items change
    const newTotal = items.reduce((acc, item) => {
      const itemAmount = item.quantity * item.unit_price;
      return acc + itemAmount;
    }, 0);
    setTotal(newTotal);
  }, [items]);

  const handleDownloadPDF = async () => {
    if (!creditNoteId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Credit note ID is missing.",
      });
      return;
    }

    try {
      setIsGeneratingPDF(true);
      const { data, error } = await supabase.storage
        .from('credit_notes')
        .getPublicUrl(`${creditNoteId}/credit-note.pdf`);
        
      if (error) {
        throw error;
      }
        
      if (data && data.publicUrl) {
        window.open(data.publicUrl, '_blank');
      } else {
        throw new Error('PDF URL not found.');
      }
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to download PDF",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendEmail = async () => {
    if (!creditNoteId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Credit note ID is missing.",
      });
      return;
    }

    try {
      setIsSendingEmail(true);

      // Call the function to send the email
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          creditNoteId: creditNoteId,
          type: 'credit_note'
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Email sent successfully!",
      });
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send email.",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSaveAsDraft = async (e: React.MouseEvent) => {
    e.preventDefault();
    await handleSubmit('draft');
  };

  const handleCreateAndSend = async (e: React.MouseEvent) => {
    e.preventDefault();
    await handleSubmit('pending');
  };

  const handleCreateAndSendYuki = async (e: React.MouseEvent) => {
    e.preventDefault();
    await handleSubmit('pending', true);
  };

  const handleSubmit = async (newStatus?: string, sendToYuki: boolean = false) => {
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
      // 1. Prepare credit note data
      const creditNoteData = {
        credit_note_number: creditNoteNumber,
        client_id: selectedClientId,
        issue_date: issueDate.toISOString(),
        status: newStatus || status,
        notes: notes,
        amount: total,
        total_amount: total,
        user_id: user.id,
      };

      let creditNoteIdToUse = creditNoteId;

      // 2. Insert or update credit note
      if (creditNoteId) {
        // Update existing credit note
        const { error } = await supabase
          .from('credit_notes')
          .update(creditNoteData)
          .eq('id', creditNoteId);

        if (error) throw error;
      } else {
        // Insert new credit note
        const { data, error } = await supabase
          .from('credit_notes')
          .insert([creditNoteData])
          .select('id');

        if (error) throw error;

        creditNoteIdToUse = data[0].id;
        setCreditNoteId(creditNoteIdToUse);
      }

      // 3. Prepare credit note items data
      const creditNoteItemsData = items.map(item => ({
        credit_note_id: creditNoteIdToUse,
        item_id: item.id,
        quantity: item.quantity,
        total_amount: item.quantity * item.unit_price,
      }));

      // 4. Delete existing items and insert new ones
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

      // 5. Generate PDF
      setIsGeneratingPDF(true);
      const { error: generatePdfError } = await supabase.functions.invoke('generate-pdf', {
        body: {
          creditNoteId: creditNoteIdToUse,
          type: 'credit_note'
        }
      });

      if (generatePdfError) throw generatePdfError;
      setPdfGenerated(true);

      // Get the URL of the newly generated PDF
      const { data: urlData } = supabase.storage
        .from('credit_notes')
        .getPublicUrl(`${creditNoteIdToUse}/credit-note.pdf`);

      if (urlData && urlData.publicUrl) {
        setPdfUrl(urlData.publicUrl);
      }

      // 6. Submit document to Storecove if status is pending
      if (newStatus === 'pending' || status === 'pending') {
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
        description: error.message || 'Failed to save credit note',
      });
    } finally {
      setIsSubmitting(false);
      setIsGeneratingPDF(false);
      setIsSubmittingToStorecove(false);
      setIsSendingToYuki(false);
    }
  };

  const getVatGroups = () => {
    const vatGroups = {};

    items.forEach(item => {
      const amount = item.quantity * item.unit_price;
      const vatRate = item.vat_rate;

      if (!vatGroups[vatRate]) {
        vatGroups[vatRate] = {
          rate: vatRate,
          value: 0,
          amount: 0,
        };
      }

      vatGroups[vatRate].value += amount;
      vatGroups[vatRate].amount += amount * (parseFloat(vatRate) / 100);
    });

    return Object.values(vatGroups);
  };

  const handleAddClient = useCallback(async (clientData: any) => {
    if (!user) return null;
    
    try {
      const newClient = {
        ...clientData,
        user_id: user.id,
        name: clientData.name, // Required field
        email: clientData.email, // Required field
        type: clientData.type || 'business' // Required field with default value
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
  }, [user, toast, supabase, setClients, setSelectedClientId]);
  
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
