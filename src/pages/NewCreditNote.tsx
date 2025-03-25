
import React, { useCallback } from 'react';
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

const NewCreditNote = () => {
  const {
    isEditMode,
    isLoading,
    isSubmitting,
    isGeneratingPDF,
    isSendingEmail,
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
  } = useCreditNoteForm();
  
  const refreshItems = useCallback(() => {
    fetchAvailableItems();
  }, [fetchAvailableItems]);

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
      <div className="credit-note-page max-w-5xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        <CreditNoteHeader 
          isEditMode={isEditMode}
          pdfUrl={pdfUrl}
          isSubmitting={isSubmitting}
          isGeneratingPDF={isGeneratingPDF}
          isSendingEmail={isSendingEmail}
          status={status}
          handleDownloadPDF={handleDownloadPDF}
          handleSaveAsDraft={handleSaveAsDraft}
          handleCreateAndSend={handleCreateAndSend}
          handleSendEmail={pdfUrl ? () => handleSendEmail() : undefined}
        />
        
        <form id="creditnote-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CreditNoteBasicInfo 
              invoiceNumber={invoiceNumber}
              issueDate={issueDate}
              setInvoiceNumber={setInvoiceNumber}
              setIssueDate={setIssueDate}
            />
            
            <ClientSelection 
              clients={clients}
              selectedClientId={selectedClientId}
              setSelectedClientId={setSelectedClientId}
              setIsAddClientModalOpen={setIsAddClientModalOpen}
            />
          </div>
          
          <CreditNoteFrom userEmail={user?.email} />
          
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
