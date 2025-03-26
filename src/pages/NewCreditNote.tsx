import React, { useCallback, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import AddClientModal from '@/components/clients/AddClientModal';
import { useCreditNoteForm } from '@/hooks/useCreditNoteForm';
import CreditNoteHeader from '@/components/creditnotes/CreditNoteHeader';
import CreditNoteBasicInfo from '@/components/creditnotes/CreditNoteBasicInfo';
import ClientSelection from '@/components/invoices/ClientSelection';
import CreditNoteFrom from '@/components/creditnotes/CreditNoteFrom';
import CreditNoteItems from '@/components/creditnotes/CreditNoteItems';
import CreditNoteNotes from '@/components/creditnotes/CreditNoteNotes';
import CreditNoteSummary from '@/components/creditnotes/CreditNoteSummary';

const SUPABASE_URL = "https://sjwqxbjxjlsdngbldhcq.supabase.co";

const NewCreditNote = () => {
  const {
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
  } = useCreditNoteForm();
  
  const refreshItems = useCallback(() => {
    fetchAvailableItems();
  }, [fetchAvailableItems]);

  // For debugging - using the direct Supabase URL for function URLs
  useEffect(() => {
    // Log the function URLs using the constant instead of supabase.supabaseUrl
    console.log('Supabase function URL:', 
      `${SUPABASE_URL}/functions/v1/submit-credit-note-document`);
    
    // Also log generate-pdf function URL
    console.log('Generate PDF function URL:', 
      `${SUPABASE_URL}/functions/v1/generate-pdf`);
  }, []);

  if (isLoading && isEditMode) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto p-4 md:p-8 text-center">
          <p className="text-muted-foreground">Loading credit note data...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-2 md:p-0 space-y-6">
        <CreditNoteHeader 
          isEditMode={isEditMode}
          pdfUrl={pdfUrl}
          pdfGenerated={pdfGenerated}
          creditNoteId={creditNoteId}
          isSubmitting={isSubmitting}
          isGeneratingPDF={isGeneratingPDF}
          isSendingEmail={isSendingEmail}
          isSubmittingToStorecove={isSubmittingToStorecove}
          isSendingToYuki={isSendingToYuki}
          status={status}
          handleDownloadPDF={handleDownloadPDF}
          handleSaveAsDraft={handleSaveAsDraft}
          handleCreateAndSend={handleCreateAndSend}
          handleSendEmail={pdfGenerated ? handleSendEmail : undefined}
          handleCreateAndSendYuki={companySettings?.yuki_email ? handleCreateAndSendYuki : undefined}
        />
        
        <form id="creditnote-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CreditNoteBasicInfo 
              creditNoteNumber={creditNoteNumber}
              issueDate={issueDate}
              setCreditNoteNumber={setCreditNoteNumber}
              setIssueDate={setIssueDate}
            />
            
            <ClientSelection 
              clients={clients}
              selectedClientId={selectedClientId}
              setSelectedClientId={setSelectedClientId}
              setIsAddClientModalOpen={setIsAddClientModalOpen}
            />
            
            <CreditNoteFrom userEmail={user?.email} />
          </div>
          
          <CreditNoteItems 
            items={items}
            availableItems={availableItems}
            vats={vats}
            currencySymbol={currencySymbol}
            handleItemDescriptionChange={handleItemDescriptionChange}
            handleItemQuantityChange={handleItemQuantityChange}
            handleItemUnitPriceChange={handleItemUnitPriceChange}
            handleItemVatChange={handleItemVatChange}
            handleAddItem={handleAddItem}
            handleRemoveItem={handleRemoveItem}
            onItemAdded={refreshItems}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CreditNoteNotes notes={notes} setNotes={setNotes} />
            <CreditNoteSummary 
              vatGroups={getVatGroups()}
              total={total}
              currencySymbol={currencySymbol}
            />
          </div>
        </form>
        
        <AddClientModal 
          isOpen={isAddClientModalOpen} 
          onClose={() => setIsAddClientModalOpen(false)} 
          onAddClient={handleAddClient} 
        />
      </div>
    </MainLayout>
  );
};

export default NewCreditNote;
