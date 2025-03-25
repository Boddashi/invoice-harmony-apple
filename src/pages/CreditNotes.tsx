
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import CreditNoteActions from '@/components/creditnotes/CreditNoteActions';

const CreditNotes = () => {
  const navigate = useNavigate();
  
  return (
    <MainLayout className="credit-note-page">
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Credit Notes</h1>
          <Button onClick={() => navigate('/creditnotes/new')} className="apple-button">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Credit Note
          </Button>
        </div>
        
        <CreditNoteActions />
      </div>
    </MainLayout>
  );
};

export default CreditNotes;
