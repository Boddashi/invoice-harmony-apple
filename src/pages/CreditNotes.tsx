
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import CreditNoteActions from '@/components/creditnotes/CreditNoteActions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const CreditNotes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchCreditNotes = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('credit_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('issue_date', { ascending: false });
        
      if (error) throw error;
      setCreditNotes(data || []);
    } catch (error: any) {
      console.error('Error fetching credit notes:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fetch credit notes'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCreditNotes();
  }, [user]);
  
  const handleStatusChange = () => {
    fetchCreditNotes();
  };
  
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
        
        {isLoading ? (
          <div className="flex justify-center p-4">
            <p className="text-muted-foreground">Loading credit notes...</p>
          </div>
        ) : creditNotes.length === 0 ? (
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No credit notes found</h3>
            <p className="text-muted-foreground mb-4">Create your first credit note to get started</p>
            <Button onClick={() => navigate('/creditnotes/new')} variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Credit Note
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {creditNotes.map((creditNote) => (
                  <tr 
                    key={creditNote.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/creditnotes/edit/${creditNote.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {creditNote.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(creditNote.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {creditNote.client_name || 'Client info loading...'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${creditNote.total_amount ? creditNote.total_amount.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${creditNote.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                        creditNote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        creditNote.status === 'paid' ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'}`}>
                        {creditNote.status.charAt(0).toUpperCase() + creditNote.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div onClick={(e) => e.stopPropagation()}>
                        <CreditNoteActions 
                          creditNoteId={creditNote.id} 
                          status={creditNote.status} 
                          onStatusChange={handleStatusChange} 
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CreditNotes;
