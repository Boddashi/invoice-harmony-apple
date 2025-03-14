
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileDown } from 'lucide-react';

interface InvoiceHeaderProps {
  isEditMode: boolean;
  pdfUrl: string | null;
  isSubmitting: boolean;
  isGeneratingPDF: boolean;
  status: 'draft' | 'pending';
  handleDownloadPDF: () => void;
  handleSaveAsDraft: (e: React.MouseEvent) => void;
  handleCreateAndSend: (e: React.MouseEvent) => void;
}

const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({
  isEditMode,
  pdfUrl,
  isSubmitting,
  isGeneratingPDF,
  status,
  handleDownloadPDF,
  handleSaveAsDraft,
  handleCreateAndSend
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/invoices')} 
          className="p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold">
          {isEditMode ? 'Edit Invoice' : 'Create New Invoice'}
        </h1>
      </div>
      
      <div className="flex gap-3">
        {pdfUrl && (
          <button 
            type="button" 
            onClick={handleDownloadPDF} 
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <FileDown size={18} />
            <span>Download PDF</span>
          </button>
        )}
        
        <button 
          type="button" 
          onClick={handleSaveAsDraft} 
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${status === 'draft' ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-50'}`} 
          disabled={isSubmitting || isGeneratingPDF}
        >
          {isSubmitting && status === 'draft' ? 'Saving...' : 'Save as Draft'}
        </button>
        
        <button 
          type="button" 
          onClick={handleCreateAndSend} 
          className="apple-button flex items-center gap-2" 
          disabled={isSubmitting || isGeneratingPDF}
        >
          {isSubmitting && status === 'pending' ? 'Saving...' : isEditMode ? 'Update & Send' : 'Create & Send'}
        </button>
      </div>
    </div>
  );
};

export default InvoiceHeader;
