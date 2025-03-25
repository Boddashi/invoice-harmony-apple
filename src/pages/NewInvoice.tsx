
import React, { useCallback } from 'react';
import MainLayout from '../components/layout/MainLayout';
import AddClientModal from '@/components/clients/AddClientModal';
import { useInvoiceForm } from '@/hooks/useInvoiceForm';
import InvoiceHeader from '@/components/invoices/InvoiceHeader';
import InvoiceBasicInfo from '@/components/invoices/InvoiceBasicInfo';
import ClientSelection from '@/components/invoices/ClientSelection';
import InvoiceFrom from '@/components/invoices/InvoiceFrom';
import InvoiceItems from '@/components/invoices/InvoiceItems';
import InvoiceNotes from '@/components/invoices/InvoiceNotes';
import InvoiceSummary from '@/components/invoices/InvoiceSummary';

const NewInvoice = () => {
  const {
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
    dueDate,
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
    setDueDate,
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
  } = useInvoiceForm();
  
  const refreshItems = useCallback(() => {
    fetchAvailableItems();
  }, [fetchAvailableItems]);

  if (isLoading && isEditMode) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto p-4 md:p-8 text-center">
          <p className="text-muted-foreground">Loading invoice data...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-2 md:p-0 space-y-6">
        <InvoiceHeader 
          isEditMode={isEditMode}
          pdfUrl={pdfUrl}
          isSubmitting={isSubmitting}
          isGeneratingPDF={isGeneratingPDF}
          isSendingEmail={isSendingEmail}
          isSubmittingToStorecove={isSubmittingToStorecove}
          status={status}
          handleDownloadPDF={handleDownloadPDF}
          handleSaveAsDraft={handleSaveAsDraft}
          handleCreateAndSend={handleCreateAndSend}
          handleCreateAndSendYuki={handleCreateAndSendYuki}
          handleSendEmail={pdfUrl ? () => handleSendEmail() : undefined}
        />
        
        <form id="invoice-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InvoiceBasicInfo 
              invoiceNumber={invoiceNumber}
              issueDate={issueDate}
              dueDate={dueDate}
              setInvoiceNumber={setInvoiceNumber}
              setIssueDate={setIssueDate}
              setDueDate={setDueDate}
            />
            
            <ClientSelection 
              clients={clients}
              selectedClientId={selectedClientId}
              setSelectedClientId={setSelectedClientId}
              setIsAddClientModalOpen={setIsAddClientModalOpen}
            />
            
            <InvoiceFrom userEmail={user?.email} />
          </div>
          
          <InvoiceItems 
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
            <InvoiceNotes notes={notes} setNotes={setNotes} />
            <InvoiceSummary 
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

export default NewInvoice;
