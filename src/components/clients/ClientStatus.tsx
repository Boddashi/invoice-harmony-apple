
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Info } from "lucide-react";

const ClientStatus = () => {
  const { user } = useAuth();
  const [clientsWithPeppol, setClientsWithPeppol] = useState(0);
  const [totalBusinessClients, setTotalBusinessClients] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientsStatus = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get count of business clients with legal entity ID (which means they have PEPPOL capability)
        const { count: peppolCount, error: peppolError } = await supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('type', 'business')
          .not('legal_entity_id', 'is', null);
          
        if (peppolError) throw peppolError;
        
        // Get total count of business clients
        const { count: totalCount, error: totalError } = await supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('type', 'business');
          
        if (totalError) throw totalError;
        
        setClientsWithPeppol(peppolCount || 0);
        setTotalBusinessClients(totalCount || 0);
      } catch (error) {
        console.error('Error fetching client PEPPOL status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClientsStatus();
  }, [user]);
  
  if (loading) return null;
  
  // Don't show anything if there are no business clients
  if (totalBusinessClients === 0) return null;
  
  const percentage = totalBusinessClients > 0 
    ? Math.round((clientsWithPeppol / totalBusinessClients) * 100) 
    : 0;
    
  return (
    <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-full">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium">PEPPOL Network Status</h3>
          <div className="mt-1 flex items-center gap-2">
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full" 
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-medium whitespace-nowrap">
              {clientsWithPeppol}/{totalBusinessClients} clients
            </span>
          </div>
        </div>
      </div>
      
      {percentage < 100 && (
        <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            {totalBusinessClients - clientsWithPeppol} of your business clients don't have PEPPOL identifiers. 
            PEPPOL enables secure e-invoicing across Europe. Add VAT numbers to your business clients to 
            enable this feature.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientStatus;
