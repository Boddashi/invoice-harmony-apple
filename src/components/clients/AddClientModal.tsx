
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Client {
  id?: string;
  type: string;
  name: string;
  email: string;
  phone?: string | null;
  street?: string | null;
  number?: string | null;
  bus?: string | null;
  postcode?: string | null;
  city?: string | null;
  country?: string;
  vatNumber?: string | null;
  vat_number?: string | null;
}

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (client: any) => void;
  onUpdateClient?: (client: any) => void;
  clientToEdit?: Client | null;
}

const AddClientModal = ({ 
  isOpen, 
  onClose, 
  onAddClient, 
  onUpdateClient,
  clientToEdit
}: AddClientModalProps) => {
  const { toast } = useToast();
  const isEditMode = !!clientToEdit;
  
  const [formData, setFormData] = useState({
    type: 'business',
    name: '',
    email: '',
    phone: '',
    street: '',
    number: '',
    bus: '',
    postcode: '',
    city: '',
    country: 'Belgium',
    vatNumber: ''
  });

  // Initialize form data when editing a client
  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        type: clientToEdit.type || 'business',
        name: clientToEdit.name || '',
        email: clientToEdit.email || '',
        phone: clientToEdit.phone || '',
        street: clientToEdit.street || '',
        number: clientToEdit.number || '',
        bus: clientToEdit.bus || '',
        postcode: clientToEdit.postcode || '',
        city: clientToEdit.city || '',
        country: clientToEdit.country || 'Belgium',
        vatNumber: clientToEdit.vatNumber || clientToEdit.vat_number || ''
      });
    }
  }, [clientToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({ ...prev, type }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Name and email are required fields."
      });
      return;
    }

    if (isEditMode && onUpdateClient && clientToEdit) {
      onUpdateClient({
        id: clientToEdit.id,
        ...formData
      });
    } else {
      onAddClient(formData);
    }

    setFormData({
      type: 'business',
      name: '',
      email: '',
      phone: '',
      street: '',
      number: '',
      bus: '',
      postcode: '',
      city: '',
      country: 'Belgium',
      vatNumber: ''
    });
    
    toast({
      title: "Success",
      description: isEditMode ? "Client updated successfully." : "Client added successfully.",
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border/40 rounded-xl shadow-lg w-full max-w-md max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-10">
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <h2 className="text-lg font-semibold">{isEditMode ? 'Edit Client' : 'Add New Client'}</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors rounded-full p-1"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Type:</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    className="w-4 h-4 accent-primary" 
                    checked={formData.type === 'business'}
                    onChange={() => handleTypeChange('business')} 
                  />
                  <span>Business</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    className="w-4 h-4 accent-primary" 
                    checked={formData.type === 'individual'}
                    onChange={() => handleTypeChange('individual')} 
                  />
                  <span>Individual</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field w-full" 
                placeholder="Client name" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field w-full" 
                placeholder="client@example.com" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field w-full" 
                placeholder="+32 123 456 789" 
              />
            </div>

            <div className="border-t border-border/40 pt-4">
              <h3 className="font-medium mb-3">Address Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Street</label>
                  <input 
                    type="text" 
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="input-field w-full" 
                    placeholder="Street name" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Number</label>
                    <input 
                      type="text" 
                      name="number"
                      value={formData.number}
                      onChange={handleChange}
                      className="input-field w-full" 
                      placeholder="123" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Bus</label>
                    <input 
                      type="text" 
                      name="bus"
                      value={formData.bus}
                      onChange={handleChange}
                      className="input-field w-full" 
                      placeholder="A" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Postcode</label>
                    <input 
                      type="text" 
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleChange}
                      className="input-field w-full" 
                      placeholder="1000" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">City</label>
                    <input 
                      type="text" 
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="input-field w-full" 
                      placeholder="Brussels" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Country</label>
                  <select 
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="input-field w-full"
                  >
                    <option value="Belgium">Belgium</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="Luxembourg">Luxembourg</option>
                    <option value="France">France</option>
                    <option value="Germany">Germany</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>
              </div>
            </div>

            {formData.type === 'business' && (
              <div className="border-t border-border/40 pt-4">
                <h3 className="font-medium mb-3">Business Details</h3>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">VAT Number</label>
                  <input 
                    type="text" 
                    name="vatNumber"
                    value={formData.vatNumber}
                    onChange={handleChange}
                    className="input-field w-full" 
                    placeholder="BE0123456789" 
                  />
                </div>
              </div>
            )}
          </div>
        </form>
        
        <div className="border-t border-border/40 p-4">
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              onClick={handleSubmit}
              className="apple-button"
            >
              {isEditMode ? 'Update Client' : 'Add Client'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddClientModal;
